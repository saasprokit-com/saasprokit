# docs

Your product's documentation site — an empty [Fumadocs](https://fumadocs.dev) app, ready for you to
fill in. Nothing here is SaaSProKit content; the boilerplate's own documentation lives in
[`docs/`](../../docs) at the repo root.

```bash
pnpm --filter docs dev      # http://localhost:3004
pnpm --filter docs build
```

## Write a page

Add `.mdx` files under `content/docs/`. Each folder can carry a `meta.json` that sets its title,
[Lucide](https://lucide.dev) icon, and page order. Start from `content/docs/index.mdx`.

## Rename the site

The nav title and OG images use `NEXT_PUBLIC_APP_NAME`, falling back to `"Docs"`. Set it in your
build environment, or edit `siteName` in `lib/layout.shared.tsx` directly.

## Layout

| Path | Description |
| --- | --- |
| `content/docs/` | Your MDX pages. |
| `lib/source.ts` | Fumadocs content source adapter. |
| `lib/layout.shared.tsx` | Site name and shared layout options. |
| `app/(home)/` | Landing route group — replace the placeholder page. |
| `app/docs/` | Documentation layout and pages. |
| `app/api/search/route.ts` | Search route handler. |
| `app/og/docs/[...slug]/` | Per-page OG images. |
| `app/llms-full.txt/` | Full-text dump for LLM consumption. |
| `source.config.ts` | Frontmatter schema and MDX plugins (including mermaid). |

Fenced ` ```mermaid ` blocks render to SVG at build time — see `components/mdx/mermaid.tsx`.

## Deploy

`wrangler.jsonc`, `open-next.config.ts`, and `Dockerfile` cover Cloudflare Workers and
Docker/VPS. `pnpm setup` prunes whichever you do not use and rebrands the Worker name to your
project slug.
