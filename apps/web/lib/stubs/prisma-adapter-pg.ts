// Aliased over @prisma/adapter-pg for the Cloudflare build (see next.config.ts).
// pg needs raw TCP and pulls in the optional pg-cloudflare native socket, which
// esbuild cannot resolve for workerd. createAdapter() in @repo/database selects
// the Neon adapter whenever CF_BUILD is set or the runtime is workerd, so this
// is never constructed — the alias exists only to keep pg out of the bundle.
export class PrismaPg {}
