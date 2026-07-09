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
