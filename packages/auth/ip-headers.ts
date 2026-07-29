/**
 * Headers used to resolve the client IP for rate limiting.
 *
 * Only headers a trusted edge sets itself are listed: Cloudflare overwrites
 * `cf-connecting-ip` on every request, and Vercel/nginx-style proxies set
 * `x-real-ip`. A bare `x-forwarded-for` is deliberately excluded — a client can
 * forge it and mint a fresh rate-limit bucket per request.
 *
 * Without this, no IP resolves behind a CDN and Better Auth falls back to a
 * single shared bucket keyed `no-trusted-ip|<path>`, so a handful of requests
 * rate-limits every visitor at once.
 */
export const IP_ADDRESS_HEADERS = ["cf-connecting-ip", "x-real-ip"];
