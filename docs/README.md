# SaaSProKit documentation

The documentation for the SaaSProKit boilerplate itself — how the monorepo is laid out, how auth,
billing, email, and deployment work. This is **not** your product's documentation: that lives in
[`apps/docs`](../apps/docs), which ships as an empty Fumadocs starter.

```bash
pnpm kit-docs:dev      # http://localhost:3006
pnpm kit-docs:build
pnpm kit-docs:deploy   # Cloudflare Workers, --env=site (maintainers only)
```

It is a workspace package named `kit-docs`, excluded from the default `pnpm dev` / `pnpm build`
fan-out so it never slows down app work. Production Docker image: `docker build -f docs/Dockerfile .`
runs `pnpm --filter kit-docs build` (not the root `pnpm build --filter=kit-docs`, which turbo-excludes this package).

## Layout

| Path | Description |
| --- | --- |
| `content/docs/` | The MDX pages. `meta.json` in each folder controls title, icon, and page order. |
| `lib/source.ts` | Fumadocs content source adapter. |
| `lib/layout.shared.tsx` | Shared layout options (nav title). |
| `app/(home)/` | Landing route group. |
| `app/docs/` | Documentation layout and pages. |
| `app/api/search/route.ts` | Search route handler. |
| `app/og/docs/[...slug]/` | Per-page OG images. |
| `app/llms-full.txt/` | Full-text dump for LLM consumption. |
| `source.config.ts` | Frontmatter schema and MDX plugins (including mermaid). |

Fenced ` ```mermaid ` blocks are rendered to SVG at build time — see `components/mdx/mermaid.tsx`.

Further reading: [Fumadocs](https://fumadocs.dev) · [Next.js](https://nextjs.org/docs).
