/**
 * Regression: the rate-limit key must not be controllable by a client sending
 * its own CF-Connecting-IP header.
 */
import { describe, it, expect } from '@jest/globals';
import { createClientIpResolver, isTrustedProxyPeer } from './utils/client-ip.js';

const makeReq = (remoteAddress, cfHeader, ip = 'express-ip') => ({
  headers: cfHeader === undefined ? {} : { 'cf-connecting-ip': cfHeader },
  socket: { remoteAddress },
  ip
});

const cloudflare = () => ({ enabled: true, type: 'cloudflare' });

describe('isTrustedProxyPeer', () => {
  it.each([
    '127.0.0.1', '::1', '10.1.2.3', '172.18.0.4', '192.168.1.10', '::ffff:172.18.0.4',
    '173.245.48.1', '104.16.5.5', '2606:4700::1111'
  ])('trusts %s', (addr) => {
    expect(isTrustedProxyPeer(addr)).toBe(true);
  });

  it.each(['8.8.8.8', '203.0.113.9', '::ffff:8.8.8.8', '2001:db8::1', '', undefined, 'not-an-ip'])(
    'does not trust %s',
    (addr) => {
      expect(isTrustedProxyPeer(addr)).toBe(false);
    }
  );
});

describe('createClientIpResolver', () => {
  it('ignores a spoofed header from a public, non-Cloudflare peer', () => {
    const resolve = createClientIpResolver(cloudflare);
    expect(resolve(makeReq('203.0.113.9', '1.2.3.4'))).toBe('express-ip');
  });

  it('uses the header when the peer is the tunnel / internal proxy', () => {
    const resolve = createClientIpResolver(cloudflare);
    expect(resolve(makeReq('172.18.0.3', '198.51.100.7'))).toBe('198.51.100.7');
  });

  it('uses the header when the peer is a Cloudflare edge address', () => {
    const resolve = createClientIpResolver(cloudflare);
    expect(resolve(makeReq('162.158.1.1', '198.51.100.7'))).toBe('198.51.100.7');
  });

  it('ignores the header when proxy mode is not cloudflare or proxy is disabled', () => {
    expect(createClientIpResolver(() => ({ enabled: true, type: 'nginx' }))(makeReq('10.0.0.2', '198.51.100.7'))).toBe('express-ip');
    expect(createClientIpResolver(() => ({ enabled: false, type: 'cloudflare' }))(makeReq('10.0.0.2', '198.51.100.7'))).toBe('express-ip');
    expect(createClientIpResolver(() => null)(makeReq('10.0.0.2', '198.51.100.7'))).toBe('express-ip');
  });

  it('ignores a header that is not a valid IP', () => {
    const resolve = createClientIpResolver(cloudflare);
    expect(resolve(makeReq('10.0.0.2', 'random-value-123'))).toBe('express-ip');
    expect(resolve(makeReq('10.0.0.2', '1.2.3.4, 5.6.7.8'))).toBe('express-ip');
  });

  it('falls back to req.ip when the header is absent', () => {
    const resolve = createClientIpResolver(cloudflare);
    expect(resolve(makeReq('10.0.0.2', undefined, '198.51.100.20'))).toBe('198.51.100.20');
  });
});
