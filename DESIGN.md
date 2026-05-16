# Design System — SaaSProKit

## Foundation

**shadcn/ui new-york neutral** is the single source of truth. All CSS variables, component styles, and defaults come from shadcn. The design system extends shadcn, never fights it.

- Style: `new-york`
- Base color: `neutral`
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
- **Display/Hero:** Geist Mono. `clamp(36px, 5vw, 64px)`, weight 500, tracking `-0.04em`
- **Section headings:** Geist Mono. `clamp(28px, 4vw, 44px)`, weight 500, tracking `-0.03em`
- **Body:** `var(--font-sans)` — Geist Sans. 15-16px, weight 400
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
- **Border radius:** `0.625rem` (shadcn default)
- **Borders:** `1px solid border` used as visual structure between sections, cards, and rows
- **Grid system:** `GridSection`, `GridBlock`, `GridSeparator` still available in `packages/design-system/components/ui/grid.tsx`

## Homepage Sections

1. **Header** — `molecules/header`: SAAS logo, nav links (Docs/Features/Pricing), user menu in right slot. Fixed overlay with scroll-aware bg via `data-scrolled`.
2. **Hero** — Centered single-column: version badge, mono heading, subtitle, primary CTA, benefits list. Subtle `bg-linear-to-b` gradient from `primary/5`.
3. **Features** — `FeaturesTerminal`: numbered feature cards, 3-column grid on `lg`.
4. **Pricing** — Plan cards driven by `getAllPlans()` from `@repo/payment`.
5. **CTA** — `CTABanner`: headline + subtitle + primary CTA. Used as the page closer.
6. **Footer** — `molecules/footer`: brand + description + 3 link sections (Products/Docs/Resources) + bottom legal links + 4 social icons (GitHub, Twitter, LinkedIn, YouTube).

## Motion
- **No animations on page load**
- **Hover transitions:** opacity or background-color, 150ms ease
- **Duration:** 100-200ms max

## Anti-Patterns (never use)
- Gradients as backgrounds
- Card shadows (use borders instead)
- Inline styles (use Tailwind classes)
- Decorative blobs, waves, or SVG dividers
- Custom color values outside the token system

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-14 | Initial design system created | Based on vercel.com/home analysis. Geist font, 12-col grid, visible guides. |
| 2026-04-14 | Grid system: DOM elements, not CSS bg | Guide lines are real divs with border-right. |
| 2026-04-21 | Switched to shadcn defaults as foundation | shadcn new-york neutral is the baseline. Design tokens live in `globals.css` as static CSS variables. |
| 2026-04-21 | Terminal aesthetic for homepage | Geist Mono headings, terminal metaphors, code-first hero. Based on HTML reference Variant B. |
| 2026-04-21 | Replaced 4-preset system with granular controls | Presets (minimal/warm/crisp/bold) replaced by individual settings: base color, fonts, radius. Superseded 2026-05-16 — runtime configurator was removed entirely. |
| 2026-04-21 | Radius default: 0.625rem (shadcn default) | Was 0rem. Now follows shadcn out of the box. |
| 2026-05-16 | Removed runtime style configurator | The configurator block, design-config provider, color presets, demo-showcase, and configure-build blocks were dropped. Tokens are now static. Removed ~600 lines of provider/CSS/components; no consumers were depending on runtime theming. |
