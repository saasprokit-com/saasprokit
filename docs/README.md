# SaaSProKit documentation

The documentation for the SaaSProKit boilerplate itself — how the monorepo is laid out, how auth,
billing, email, and deployment work. This is **not** your product's documentation: that lives in
[`apps/docs`](../apps/docs), which ships as an empty Fumadocs starter.

```bash
pnpm kit-docs:dev      # http://localhost:3006/docs
pnpm kit-docs:build
pnpm kit-docs:deploy   # Cloudflare Workers, --env=site (maintainers only)
```

Production URL is <https://saasprokit.com/docs> — a zone route layered on the marketing site's
apex, not a hostname of its own (see the comments in `wrangler.jsonc`). The app is served under
Next's `basePath: "/docs"`, so `/` is a 404 everywhere including local dev and Docker; the docs
index is `/docs`. `docs.saasprokit.com` still resolves here and 308s to the new URLs.

It is a workspace package named `kit-docs`, excluded from the default `pnpm dev` / `pnpm build`
fan-out so it never slows down app work. It deploys to Cloudflare Workers only — build it with
`pnpm --filter kit-docs build`, not the root `pnpm build --filter=kit-docs`, which turbo-excludes this package.

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
