# SaaSProKit documentation

The documentation for the SaaSProKit boilerplate itself — how the monorepo is laid out, how auth,
billing, email, and deployment work. This is **not** your product's documentation: that lives in
[`apps/docs`](../apps/docs), which ships as an empty Fumadocs starter.

Scratch plans, reviews, and specs written while working on the kit go in `.docs/` (gitignored),
never in this `docs/` folder — this one is the product we ship, and `pnpm setup` deletes it from a
customer's clone along with every reference to it.

```bash
pnpm kit-docs:dev      # http://localhost:3006/docs
pnpm kit-docs:build
pnpm kit-docs:deploy   # Cloudflare Workers, --env=site (maintainers only)
```

Production URL is <https://saasprokit.com/docs>. The app is served under Next's
`basePath: "/docs"` (from `DOCS_PATH` in `lib/site.ts`, the single source for both the basePath
and the canonical URLs), so `/` is a 404 everywhere including local dev; the docs index is `/docs`.

### Why a zone route, not a hostname

`saasprokit.com` is a Custom Domain on the separate `saasprokit-site` worker, so this worker cannot
claim the hostname. It attaches as **zone routes**, which Cloudflare gives precedence over a Custom
Domain for the paths they match: `/docs` lands here, every other path still hits the site worker.
Two patterns rather than `/docs*`, which would also swallow `/docsfoo`. Deploying them needs
**Workers Routes edit on the `saasprokit.com` zone** — the custom-domain-only config did not.

`docs.saasprokit.com` stays attached so old URLs still reach this worker, where the two redirects in
`next.config.ts` 308 them to the new host. Both opt out of the basePath: the first maps
`/docs/:path+` one-to-one, the second sweeps every remaining old-host path to the docs index.

It is a workspace package named `kit-docs`, excluded from the default `pnpm dev` / `pnpm build`
fan-out so it never slows down app work. It deploys to Cloudflare Workers only — build it with
`pnpm --filter kit-docs build`, not the root `pnpm build --filter=kit-docs`, which turbo-excludes this package.
It has no Docker Compose service — start it directly with `pnpm kit-docs:dev`.

## Removal at setup

`pnpm run setup` deletes this entire directory (`rmSync`) along with every reference to it: the
`docs` entry in `pnpm-workspace.yaml`, the `kit-docs:*` scripts and `--filter=!kit-docs` guards on
`build`/`dev` in the root `package.json`, the `COPY docs/` step in `docker/dev.Dockerfile`, the
`!docs/**/*.json` exclude in `biome.jsonc`, and the `(kit-docs)` entry in `.vscode/launch.json`. The
customer's clone never contains this package or a dangling mention of it — `CLAUDE.md`, `AGENTS.md`,
`README.md`, and the `env-setup` skill are written to already describe a repo without it, so nothing
there needs rewriting at setup time.

## Layout

| Path | Description |
| --- | --- |
| `content/docs/` | The MDX pages. `meta.json` in each folder controls title, icon, and page order. |
| `lib/source.ts` | Fumadocs content source adapter. `baseUrl` is `/` — the `basePath` does the prefixing. |
| `lib/site.ts` | Canonical URLs (`docsUrl`) shared by metadata and the sitemap. |
| `lib/layout.shared.tsx` | Shared layout options (nav title and links). |
| `app/(docs)/` | Documentation layout and pages, mounted at the app root. |
| `app/api/search/route.ts` | Search route handler. |
| `app/og/docs/[...slug]/` | Per-page OG images. |
| `app/sitemap.ts` | Sitemap at `/docs/sitemap.xml`, listed in the marketing site's `robots.txt`. |
| `app/llms-full.txt/` | Full-text dump for LLM consumption. |
| `_headers` | Immutable caching for `/docs/_next/static/*`. Copied to the assets root by `cf:build`, because OpenNext puts `public/` under the basePath where Workers Assets ignores it. |
| `source.config.ts` | Frontmatter schema and MDX plugins (including mermaid). |

Fenced ` ```mermaid ` blocks are rendered to SVG at build time — see `components/mdx/mermaid.tsx`.

Further reading: [Fumadocs](https://fumadocs.dev) · [Next.js](https://nextjs.org/docs).
