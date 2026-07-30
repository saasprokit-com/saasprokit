/**
 * Headers used to resolve the client IP for rate limiting, tried in order.
 *
 * CDN-set headers win first: Cloudflare overwrites `cf-connecting-ip` on every
 * request, Vercel sets `x-real-ip`. `x-forwarded-for` stays as the last resort
 * for hosts whose proxy sets nothing else (ALB, nginx, Docker) — Better Auth
 * only trusts it when single-valued, so a client-forged chain (the CDN appends
 * the real IP behind it) is rejected rather than minting fresh rate-limit
 * buckets. Dropping it entirely would collapse those hosts into one shared
 * bucket keyed `no-trusted-ip|<path>`, rate-limiting every visitor at once.
 *
 * Header names are not a trust boundary — a directly exposed origin can be
 * fed a forged `x-real-ip` too. Deployments behind untrusted hops should set
 * Better Auth's `advanced.ipAddress.trustedProxies` as the real enforcement.
 */
export const IP_ADDRESS_HEADERS = [
  "cf-connecting-ip",
  "x-real-ip",
  "x-forwarded-for",
];
