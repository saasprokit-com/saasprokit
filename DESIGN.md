# Design System — SaaSProKit

**This file documents what the code actually ships.** A previous version described a
"Terminal Minimal" direction — monospace headings, a neutral near-black primary — that was
never built. Every value below was read out of `packages/design-system/styles/globals.css`
and the block components. If you change a token, change this file in the same commit.

## Foundation

**shadcn/ui new-york** is the base. The design system extends shadcn, never fights it.

- Style: `new-york`
- CSS variables: OKLCH, defined in `packages/design-system/styles/globals.css`
- Components: shadcn primitives in `packages/design-system/components/ui/`
- Border radius: `0.625rem` (`--radius`)

## Product Context

- **What this is:** Production-ready SaaS boilerplate with auth, billing, organizations
- **Who it's for:** Developers building SaaS products
- **Project type:** Marketing homepage + SaaS web app

## Color

The base scale is neutral; **the primary is a vermilion orange** and is the only chromatic
token in the system. That is deliberate — developer tooling clusters on violet, indigo and
acid green, so vermilion is the differentiator.

| Token | Light | Dark |
|---|---|---|
| `--background` | `oklch(1 0 0)` | `oklch(0.145 0 0)` |
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `--primary` | `oklch(0.553 0.195 38.402)` | `oklch(0.47 0.157 37.304)` |
| `--primary-foreground` | near-white | `oklch(0.98 0.016 73.684)` |
| `--accent` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` |
| `--border` | `oklch(0.922 0 0)` | `oklch(0.269 0 0)` |
| `--muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.708 0 0)` |

Syntax highlighting has its own tokens: `--code-keyword`, `--code-string`, `--code-function`,
`--code-type`. Dark mode is a `.dark` class via `next-themes`.

**Do not add a second accent colour.** One chromatic token is what makes the vermilion read
as intentional.

## Typography

Two families, both self-hosted through `next/font` via the `geist` package
(`packages/design-system/lib/fonts.ts`). **No webfonts are fetched over the network** — the
CSP has no third-party font host, and adding one would need a CSP change too.

- **Display / headings:** Geist Sans (`--font-sans`), `font-bold`, `tracking-tight`
- **Body:** Geist Sans, weight 400
- **Code and data:** Geist Mono (`--font-mono`)

**Mono is reserved for content that is literally code or data** — `code-preview`,
`deps-table`, version strings, identifiers. It is not a decorative choice. Headings are sans;
setting them in mono is the single most common look in this category and signals nothing.

Heading scale as used by the blocks: `text-3xl` / `text-4xl` for section headings
(`sm:text-4xl` responsive step), `text-5xl`–`text-6xl` reserved for the hero `h1`,
`text-xl`–`text-2xl` for card titles.

## Spacing and layout

- **Section padding:** `py-24` is the standard (`py-32` for the hero)
- **Max content width:** `max-w-7xl` with `mx-auto`; prose columns cap at `max-w-2xl`
- **Card padding:** `p-8`
- **Base unit:** 8px

`GridSection`, `GridBlock` and `GridSeparator` live in
`packages/design-system/components/ui/grid.tsx` for border-disciplined layouts.

## Motion

framer-motion 12. Presets are shared from
`packages/design-system/components/blocks/motion-presets.ts` — import them, never redeclare
the values locally.

| Preset | Value | Used for |
|---|---|---|
| `EASE` | `[0.22, 1, 0.36, 1]` | everything — expo-out, fast start and long settle |
| `containerVariants` | `staggerChildren: 0.08`, `delayChildren: 0.1` | lists and grids |
| `itemVariants` | `opacity 0→1`, `y 24→0`, `0.5s` | individual cards and rows |
| `revealVariants` | `opacity 0→1`, `y 32→0`, `0.6s` | whole-section reveals |
| `VIEWPORT_ONCE` | `{ once: true, amount: 0.2 }` | every scroll trigger |

Rules:

- **Opacity and transform only.** Anything that triggers layout is off-limits.
- **`once: true` everywhere.** Re-animating on scroll-back reads as a glitch.
- **No parallax, no scroll-linked effects.**
- **Reduced motion is handled globally** by `MotionProvider`
  (`packages/design-system/providers/motion.tsx`), which sets `MotionConfig
  reducedMotion="user"`. Transform animations are suppressed for visitors who ask for it;
  opacity fades stay, because they are not a vestibular trigger. Individual components do
  not need their own `useReducedMotion` check unless they animate outside framer-motion.

## Decisions log

- **2026-07-31** — Rewrote this file to match the shipped code. It had claimed a neutral
  `oklch(0.205 0 0)` primary and monospace headings; neither was ever implemented. `CLAUDE.md`
  points every agent here first, so the wrong spec was propagating into new work.
- **2026-07-31** — Removed three unused Google Fonts imports (Inter, DM Sans, Plus Jakarta
  Sans). Five families were loading and two were rendering. The CSP's
  `fonts.googleapis.com` / `fonts.gstatic.com` allowances went with them.
- **2026-07-31** — Extracted the duplicated `EASE` constant into `motion-presets.ts` and
  added global reduced-motion support, which nothing had before.
