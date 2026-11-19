/**
 * Client IP resolution for rate limiting.
 *
 * `CF-Connecting-IP` is set by Cloudflare, but any client can also send it.
 * It is only trusted when proxy mode is "cloudflare" AND the TCP peer is a hop
 * we expect to sit between Cloudflare and the app: a loopback/private address
 * (cloudflared tunnel, nginx, container network) or a Cloudflare edge address.
 * Otherwise the header is ignored and Express's `req.ip` (which honours the
 * `trust proxy` setting) is used.
 */
import net from 'net';

// https://www.cloudflare.com/ips/
export const CLOUDFLARE_IPV4_RANGES = [
  '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22',
  '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20',
  '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
  '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22'
];

export const CLOUDFLARE_IPV6_RANGES = [
  '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32',
  '2405:8100::/32', '2a06:98c0::/29', '2c0f:f248::/32'
];

const PRIVATE_IPV4_RANGES = ['127.0.0.0/8', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '100.64.0.0/10'];
const PRIVATE_IPV6_RANGES = ['::1/128', 'fc00::/7', 'fe80::/10'];

const trustedPeers = new net.BlockList();
for (const range of [...PRIVATE_IPV4_RANGES, ...CLOUDFLARE_IPV4_RANGES]) {
  const [address, prefix] = range.split('/');
  trustedPeers.addSubnet(address, Number(prefix), 'ipv4');
}
for (const range of [...PRIVATE_IPV6_RANGES, ...CLOUDFLARE_IPV6_RANGES]) {
  const [address, prefix] = range.split('/');
  trustedPeers.addSubnet(address, Number(prefix), 'ipv6');
}

const normalizeAddress = (address) => {
  if (typeof address !== 'string') return null;
  const trimmed = address.trim();
  // IPv4-mapped IPv6 (e.g. ::ffff:10.0.0.5) -> plain IPv4
  const mapped = trimmed.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  return mapped ? mapped[1] : trimmed;
};

export const isTrustedProxyPeer = (address) => {
  const normalized = normalizeAddress(address);
  const family = net.isIP(normalized || '');
  if (!family) return false;
  return trustedPeers.check(normalized, family === 4 ? 'ipv4' : 'ipv6');
};

/**
 * @param {() => { enabled: boolean, type: string }} getProxyConfig
 * @returns {(req: import('express').Request) => string}
 */
export const createClientIpResolver = (getProxyConfig) => (req) => {
  const { enabled, type } = getProxyConfig() || {};
  const header = req.headers['cf-connecting-ip'];
  const headerIp = normalizeAddress(Array.isArray(header) ? header[0] : header);

  if (
    enabled &&
    type === 'cloudflare' &&
    headerIp &&
    net.isIP(headerIp) &&
    isTrustedProxyPeer(req.socket?.remoteAddress)
  ) {
    return headerIp;
  }

  return req.ip;
};
