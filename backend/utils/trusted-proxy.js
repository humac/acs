/**
 * Reverse-proxy trust and rate-limit keys.
 *
 * Client-supplied headers (CF-Connecting-IP, X-Forwarded-For entries) are never
 * trusted on their own. Express resolves `req.ip` by walking X-Forwarded-For
 * from the right and skipping hops that the `trust proxy` setting trusts; the
 * first untrusted hop is the client. Because each trusted proxy appends the
 * address it actually received the connection from, a client cannot insert a
 * fake address to the right of its own.
 *
 * Proxy modes:
 * - cloudflare: trust loopback/private/CGNAT hops (tunnel, nginx, platform
 *   ingress), Cloudflare edge ranges, and any TRUSTED_PROXY_CIDRS. Cloudflare
 *   appends the real client address to X-Forwarded-For, so req.ip becomes the
 *   visitor. Hop count is not used.
 * - standard: trust exactly `trustLevel` hops (Express numeric setting).
 * - none / disabled: trust nothing; req.ip is the TCP peer.
 */
import net from 'net';
import { ipKeyGenerator } from 'express-rate-limit';

// https://www.cloudflare.com/ips/
export const CLOUDFLARE_RANGES = [
  '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22',
  '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20',
  '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
  '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
  '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32',
  '2405:8100::/32', '2a06:98c0::/29', '2c0f:f248::/32'
];

export const PRIVATE_RANGES = [
  '127.0.0.0/8', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '100.64.0.0/10',
  '::1/128', 'fc00::/7', 'fe80::/10'
];

const normalizeAddress = (address) => {
  if (typeof address !== 'string') return null;
  const trimmed = address.trim();
  // IPv4-mapped IPv6 (e.g. ::ffff:10.0.0.5) -> plain IPv4
  const mapped = trimmed.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  return mapped ? mapped[1] : trimmed;
};

/**
 * Parse a comma-separated CIDR/IP list (e.g. TRUSTED_PROXY_CIDRS).
 * Invalid entries are reported via `onInvalid` and skipped.
 */
export const parseCidrList = (value, onInvalid = () => {}) => {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => {
      const [address, prefix] = entry.split('/');
      const family = net.isIP(address);
      const maxPrefix = family === 6 ? 128 : 32;
      const valid = family !== 0 && (prefix === undefined || (/^\d+$/.test(prefix) && Number(prefix) <= maxPrefix));
      if (!valid) onInvalid(entry);
      return valid;
    });
};

const buildBlockList = (cidrs) => {
  const list = new net.BlockList();
  for (const cidr of cidrs) {
    const [address, prefix] = cidr.split('/');
    const type = net.isIP(address) === 6 ? 'ipv6' : 'ipv4';
    if (prefix === undefined) {
      list.addAddress(address, type);
    } else {
      list.addSubnet(address, Number(prefix), type);
    }
  }
  return list;
};

/**
 * @param {string[]} extraCidrs - operator-supplied ranges (TRUSTED_PROXY_CIDRS)
 * @returns {(address: string) => boolean}
 */
export const createTrustedProxyMatcher = (extraCidrs = []) => {
  const list = buildBlockList([...PRIVATE_RANGES, ...CLOUDFLARE_RANGES, ...extraCidrs]);
  return (address) => {
    const normalized = normalizeAddress(address);
    const family = net.isIP(normalized || '');
    if (!family) return false;
    return list.check(normalized, family === 4 ? 'ipv4' : 'ipv6');
  };
};

/**
 * Value for `app.set('trust proxy', ...)`.
 * @param {{ enabled: boolean, type: string, trustLevel: number }} proxy
 * @param {string[]} extraCidrs
 */
export const resolveTrustProxySetting = (proxy, extraCidrs = []) => {
  if (!proxy?.enabled || proxy.type === 'none') {
    return false;
  }
  if (proxy.type === 'cloudflare') {
    const isTrusted = createTrustedProxyMatcher(extraCidrs);
    return (address) => isTrusted(address);
  }
  const level = Number(proxy.trustLevel);
  return Number.isInteger(level) && level > 0 ? level : 1;
};

/**
 * Rate-limit key: the resolved client IP, with IPv6 grouped to its /56 so a
 * client cannot rotate through its own IPv6 allocation to get fresh buckets.
 */
export const rateLimitKey = (req) => {
  const ip = normalizeAddress(req.ip) || normalizeAddress(req.socket?.remoteAddress);
  return ip ? ipKeyGenerator(ip, 56) : 'unknown';
};
