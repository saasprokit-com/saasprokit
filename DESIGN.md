# Design System — SaaSProKit

## Foundation

**shadcn/ui new-york neutral** is the single source of truth. All CSS variables, component styles, and defaults come from shadcn. The design system extends shadcn, never fights it.

- Style: `new-york`
- Base color: `neutral` (configurable via granular controls)
- CSS variables: OKLCH color space, defined in `globals.css`
- Components: shadcn/ui primitives from `packages/design-system/components/ui/`

## Product Context
- **What this is:** Production-ready SaaS boilerplate with auth, billing, organizations
- **Who it's for:** Developers building SaaS products
- **Space/industry:** Developer tools, open source boilerplate
- **Project type:** Marketing homepage + SaaS web app

## Aesthetic Direction
- **Direction:** Terminal Minimal
- **Decoration level:** Minimal — borders are structure, code is decoration
- **Mood:** Developer-first. Monospace headings, terminal metaphors, code-forward hero. Confident engineering aesthetic.
- **Reference:** HTML landing page reference (Variant B: Terminal)

## Typography
- **Display/Hero:** `var(--heading-font)` — defaults to Geist Mono, configurable. `clamp(36px, 5vw, 64px)`, weight 500, tracking `-0.04em`
- **Section headings:** `var(--heading-font)` — `clamp(28px, 4vw, 44px)`, weight 500, tracking `-0.03em`
- **Body:** `var(--font-sans)` — defaults to Geist Sans. 15-16px, weight 400
- **Labels/Meta:** Geist Mono — 11px, uppercase, tracking `0.15em`
- **Code:** Geist Mono — 13px
- **Loading:** Built into Next.js via `next/font/local` (already configured)
- **Scale:** 11/12/13/14/15/16/20/24/28/32/44/64/72px

## Color
- **Approach:** shadcn defaults. All colors from `:root` in globals.css
- **Background:** `oklch(1 0 0)` (white) / `oklch(0.145 0 0)` (near-black, dark)
- **Foreground:** `oklch(0.145 0 0)` / `oklch(0.985 0 0)`
- **Primary:** `oklch(0.205 0 0)` — near-black in light, near-white in dark (same as foreground inverted)
- **Border:** `oklch(0.922 0 0)` / `oklch(0.269 0 0)`
- **Muted foreground:** `oklch(0.556 0 0)` / `oklch(0.708 0 0)`
- **Base color families:** neutral (default), slate, stone, zinc, gray — configurable via `data-base-color` attribute
- **Code syntax:** `--code-keyword` (purple), `--code-string` (green), `--code-function` (blue), `--code-type` (orange)
- **Dark mode:** `.dark` class via next-themes. All colors invert via CSS custom properties.

## Spacing
- **Base unit:** 8px
- **Section padding:** `py-20 px-6 sm:px-10` (80px vertical, 24-40px horizontal)
- **Card padding:** `p-8` (32px)
- **Max content width:** `max-w-7xl` (1280px) with `mx-auto`
- **Hero min-height:** 600px

## Layout
- **Approach:** Border-disciplined sections
- **Max content width:** 1280px (`max-w-7xl`)
- **Border radius:** `0.625rem` (shadcn default, configurable 0-1.0)
- **Borders:** `1px solid border` used as visual structure between sections, cards, and rows
- **Grid system:** `GridSection`, `GridBlock`, `GridSeparator` still available in `packages/design-system/components/ui/grid.tsx`

## Design Configurator

Granular controls replacing the old preset system. Each control updates the page live.

- **Base Color:** neutral, slate, stone, zinc, gray
- **Theme:** light / dark
- **Heading Font:** Geist Mono, Geist Sans, Inter, DM Sans, Plus Jakarta
- **Body Font:** Geist Sans, Inter, DM Sans, Plus Jakarta
- **Radius:** 0, 0.3, 0.5, 0.625 (default), 0.75, 1.0

Config persists to `localStorage` key `"design-config"`. Flash-prevention inline script applies config before React hydrates.

Files:
- Provider: `packages/design-system/providers/design-config.tsx`
- Script: `packages/design-system/providers/design-config-script.tsx`
- CSS: `packages/design-system/styles/design-config.css`
- UI: `packages/design-system/components/blocks/style-configurator/style-configurator.tsx`

## Homepage Sections

1. **Header** — SAAS wordmark, nav links (docs/features/pricing), demo CTA
2. **Hero** — Split layout: text left (version badge, mono heading, CTAs) + code preview right (tabbed: auth.ts, billing.ts, schema.prisma)
3. **Features** — 6 cards numbered 01-06, 3-column grid
4. **Dependencies** — package.json-style table showing all tech deps
5. **Testimonials** — 3 cards with quotes, avatars, social links
6. **Configure** — Live preview panel + granular configurator controls
7. **Pricing** — DB-driven plans in terminal-style cards
8. **CTA** — Dark bg, "you — shipping by Sunday." terminal-style
9. **Footer** — 5-column grid (/product, /docs, /resources, /legal), "$ exit 0"

## Motion
- **No animations on page load**
- **Hover transitions:** opacity or background-color, 150ms ease
- **Duration:** 100-200ms max

## Anti-Patterns (never use)
- Gradients as backgrounds
- Card shadows (use borders instead)
- Inline styles (use Tailwind classes)
- Decorative blobs, waves, or SVG dividers
- Overriding shadcn defaults without configurator support
- Custom color values outside the token system

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-14 | Initial design system created | Based on vercel.com/home analysis. Geist font, 12-col grid, visible guides. |
| 2026-04-14 | Grid system: DOM elements, not CSS bg | Guide lines are real divs with border-right. |
| 2026-04-21 | Switched to shadcn defaults as foundation | shadcn new-york neutral is the baseline. All customization flows through the granular configurator, not hardcoded presets. |
| 2026-04-21 | Terminal aesthetic for homepage | Geist Mono headings, terminal metaphors, code-first hero. Based on HTML reference Variant B. |
| 2026-04-21 | Replaced 4-preset system with granular controls | Presets (minimal/warm/crisp/bold) replaced by individual settings: base color, fonts, radius. More flexible, aligns with shadcn's own theming approach. |
| 2026-04-21 | Radius default: 0.625rem (shadcn default) | Was 0rem. Now follows shadcn out of the box, configurable via controls. |
