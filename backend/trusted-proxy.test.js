/**
 * Regression: rate-limit keys must reflect the real client and must not be
 * controllable by client-supplied headers or IPv6 address rotation.
 *
 * Exercised through a real Express app so `trust proxy` resolution of
 * X-Forwarded-For is tested end to end. supertest connects from loopback, which
 * plays the role of the nearest trusted proxy (nginx / platform ingress).
 */
import { describe, it, expect } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import {
  createTrustedProxyMatcher,
  parseCidrList,
  rateLimitKey,
  resolveTrustProxySetting
} from './utils/trusted-proxy.js';

const appWith = (proxy, extraCidrs = []) => {
  const app = express();
  const setting = resolveTrustProxySetting(proxy, extraCidrs);
  if (setting !== false) app.set('trust proxy', setting);
  app.get('/key', (req, res) => res.json({ key: rateLimitKey(req) }));
  return app;
};

const keyFor = async (app, headers = {}) => {
  const req = request(app).get('/key');
  for (const [name, value] of Object.entries(headers)) req.set(name, value);
  const res = await req;
  return res.body.key;
};

const cloudflare = { enabled: true, type: 'cloudflare', trustLevel: 1 };

describe('cloudflare proxy mode', () => {
  const app = appWith(cloudflare);

  it('resolves the visitor behind Cloudflare edge + ingress hops', async () => {
    // Cloudflare appended the visitor, ingress appended the Cloudflare edge address
    expect(await keyFor(app, { 'X-Forwarded-For': '198.51.100.7, 104.16.0.5, 10.0.0.4' })).toBe('198.51.100.7');
  });

  it('ignores a spoofed CF-Connecting-IP header entirely', async () => {
    const key = await keyFor(app, {
      'CF-Connecting-IP': '1.2.3.4',
      'X-Forwarded-For': '198.51.100.9'
    });
    expect(key).toBe('198.51.100.9');
  });

  it('cannot be spoofed with fake left-hand X-Forwarded-For entries', async () => {
    // Attacker sent "1.2.3.4, 104.16.0.5"; the ingress appended the attacker's real address
    expect(await keyFor(app, { 'X-Forwarded-For': '1.2.3.4, 104.16.0.5, 198.51.100.9' })).toBe('198.51.100.9');
  });

  it('a direct request through a platform ingress keys on the caller, not the ingress', async () => {
    // Azure Container Apps style: ingress (private) appended the real caller
    expect(await keyFor(app, { 'X-Forwarded-For': '203.0.113.50' })).toBe('203.0.113.50');
  });

  it('groups IPv6 clients by /56 so address rotation does not create new buckets', async () => {
    const a = await keyFor(app, { 'X-Forwarded-For': '2001:db8:1:2::1' });
    const b = await keyFor(app, { 'X-Forwarded-For': '2001:db8:1:2:ffff:ffff:ffff:9' });
    const c = await keyFor(app, { 'X-Forwarded-For': '2001:db8:1:ab::1' });
    expect(a).toBe(b);
    expect(a).toBe(c); // same /56
    const other = await keyFor(app, { 'X-Forwarded-For': '2001:db8:2::1' });
    expect(other).not.toBe(a);
  });

  it('trusts operator-supplied TRUSTED_PROXY_CIDRS hops', async () => {
    const xff = { 'X-Forwarded-For': '198.51.100.7, 20.1.2.3' };
    expect(await keyFor(app, xff)).toBe('20.1.2.3');
    expect(await keyFor(appWith(cloudflare, ['20.1.2.3/32']), xff)).toBe('198.51.100.7');
  });
});

describe('standard and disabled modes', () => {
  it('standard mode trusts exactly trustLevel hops', async () => {
    const app = appWith({ enabled: true, type: 'standard', trustLevel: 1 });
    expect(await keyFor(app, { 'X-Forwarded-For': '1.1.1.1, 2.2.2.2' })).toBe('2.2.2.2');
  });

  it('disabled proxy or type none uses the TCP peer and ignores headers', async () => {
    for (const proxy of [{ enabled: false, type: 'cloudflare' }, { enabled: true, type: 'none' }]) {
      const key = await keyFor(appWith(proxy), { 'X-Forwarded-For': '1.1.1.1', 'CF-Connecting-IP': '2.2.2.2' });
      expect(['127.0.0.1', '::1']).toContain(key);
    }
  });
});

describe('helpers', () => {
  it('createTrustedProxyMatcher covers private, loopback, mapped and Cloudflare addresses', () => {
    const isTrusted = createTrustedProxyMatcher();
    for (const addr of ['127.0.0.1', '::1', '10.1.2.3', '172.18.0.4', '192.168.1.10', '100.100.1.1', '::ffff:172.18.0.4', '173.245.48.1', '2606:4700::1111']) {
      expect(isTrusted(addr)).toBe(true);
    }
    for (const addr of ['8.8.8.8', '203.0.113.9', '::ffff:8.8.8.8', '2001:db8::1', '', undefined, 'nope']) {
      expect(isTrusted(addr)).toBe(false);
    }
  });

  it('parseCidrList keeps valid entries and reports invalid ones', () => {
    const invalid = [];
    const parsed = parseCidrList(' 20.1.2.3/32, 2001:db8::/48 ,bad, 10.0.0.0/33, 1.2.3.4 ', (e) => invalid.push(e));
    expect(parsed).toEqual(['20.1.2.3/32', '2001:db8::/48', '1.2.3.4']);
    expect(invalid).toEqual(['bad', '10.0.0.0/33']);
    expect(parseCidrList(undefined)).toEqual([]);
  });

  it('rateLimitKey falls back safely when no address is known', () => {
    expect(rateLimitKey({ ip: undefined, socket: {} })).toBe('unknown');
  });
});
