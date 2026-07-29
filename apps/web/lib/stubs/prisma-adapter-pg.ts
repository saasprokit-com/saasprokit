// Build-time stub aliased over @prisma/adapter-pg for the Cloudflare target
// (CF_BUILD=1, see next.config.ts). The pg driver needs raw TCP and pulls in the
// optional pg-cloudflare native socket, neither of which bundles for workerd.
//
// Nothing calls this at runtime: packages/database picks PrismaNeon whenever
// navigator.userAgent === "Cloudflare-Workers", so the pg branch is dead code
// on Workers. Throwing keeps a silent misconfiguration from looking healthy.

// Constructing it is harmless; only an actual connection attempt is a bug, so
// the error is raised there to keep the Cloudflare build itself unaffected.
export class PrismaPg {
  readonly provider = "postgres";
  readonly adapterName = "@prisma/adapter-pg";

  connect(): never {
    throw new Error(
      "PrismaPg is unavailable on Cloudflare Workers — the Neon adapter should have been selected. Check createAdapter() in @repo/database."
    );
  }
}
