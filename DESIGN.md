# Design System — SaaSProKit

## Product Context
- **What this is:** Production-ready SaaS boilerplate with auth, billing, organizations
- **Who it's for:** Developers building SaaS products
- **Space/industry:** Developer tools, open source boilerplate
- **Project type:** Marketing homepage + SaaS web app

## Aesthetic Direction
- **Direction:** Brutally Minimal
- **Decoration level:** Minimal — the grid IS the decoration
- **Mood:** Confident and geometric, but warm. Engineering precision with human energy. Not a cold blueprint... a workshop where things get built.
- **Reference sites:** vercel.com/home (grid system, structure), shipfa.st (warmth, social proof, energy)

## Grid System
- **Type:** Page-level 12-column grid with visible guide lines
- **Guide lines:** Real DOM elements with `border-right: 1px solid var(--border)`, `aria-hidden="true"`
- **Responsive columns:** 8 (sm), 10 (md), 12 (lg)
- **Cross markers:** 21px + shape at section intersections
- **Section types:** SEPARATOR (guides only, no content) and CONTENT (blocks spanning columns)
- **Components:** `GridSection`, `GridBlock`, `GridSeparator` in `packages/design-system/components/ui/grid.tsx`

## Typography
- **Display/Hero:** Geist Sans — 48px, weight 600 (semibold)
- **Body:** Geist Sans — 16px, weight 400
- **UI/Labels:** Geist Sans — 14px, weight 500
- **Data/Tables:** Geist Sans (tabular-nums) — 14px
- **Code:** Geist Mono
- **Loading:** Built into Next.js via `next/font/local` (already configured)
- **Scale:** 12/14/16/20/24/32/48px

## Color
- **Approach:** Restrained — color is rare and meaningful
- **Background:** #fafafa (off-white, light mode) / #0a0a0a (near-black, dark mode)
- **Foreground:** #171717 (near-black, light mode) / #ededed (off-white, dark mode)
- **Border/guides:** #ebebeb (light) / #2e2e2e (dark)
- **Accent:** #0072f5 (blue) — links, CTAs, interactive highlights. Clean and professional.
- **Accent (alternatives):** amber #F59E0B, green, orange, red, violet — available in configurator.
- **Muted text:** #666666 (light) / #888888 (dark)
- **Semantic:** success #17a34a, warning #eab308, error #dc2626, info #0072f5
- **Dark mode:** Invert surfaces, reduce saturation. No gradients in either mode.

## Spacing
- **Base unit:** 8px
- **Density:** Spacious — sections breathe
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64) 4xl(80) 5xl(120)
- **Section padding:** 40px (p-10) minimum per grid block

## Layout
- **Approach:** Grid-disciplined
- **Grid:** 12 columns at lg, content within `max-w-7xl` (1280px)
- **Max content width:** 1280px
- **Border radius:** 0 everywhere (`--radius: 0rem`)
- **Borders:** 1px solid, used as visual structure (not decoration)

## Motion
- **Approach:** Minimal-functional
- **No animations on page load**
- **Hover transitions:** opacity or background-color, 150ms ease
- **Easing:** ease-out for enter, ease-in for exit
- **Duration:** 100-200ms max

## Social Proof (new section, inspired by ShipFast)
- **GitHub stars badge** in hero (real count from GitHub API or static)
- **Contributor avatars** row (3-5 contributors, fetched or static)
- **Key metrics**: "9 features", "35 E2E tests", "8 technologies"
- Style: understated, not ShipFast-level hype. Numbers, not testimonials.
- Placement: below hero CTAs or in the benefits column

## Anti-Patterns (never use)
- Gradients as backgrounds
- Colored circles behind icons
- Card shadows (use borders instead)
- Rounded corners (radius is 0 by default, configurable via configurator)
- Purple/violet anything
- Centered everything — left-align by default
- Decorative blobs, waves, or SVG dividers
- Background patterns (the grid guides ARE the pattern)
- Fake testimonials or placeholder social proof

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-14 | Initial design system created | Based on vercel.com/home analysis via /design-consultation. Geist font, 12-col grid, visible guides, 0 radius. |
| 2026-04-14 | Grid system: DOM elements, not CSS bg | Learned from inspecting vercel.com/pricing that guide lines are real divs with border-right, not background-image patterns. |
| 2026-04-14 | Border radius: 0rem globally | User requested. Set via --radius CSS variable in globals.css. |
| 2026-04-15 | Accent color: amber #F59E0B (was blue) | ShipFast comparison showed blue is cold for a boilerplate. Amber adds warmth while keeping geometric grid DNA. |
| 2026-04-15 | Added social proof section spec | ShipFast has 19 avatars + revenue testimonials. We go understated: GitHub stars, contributor avatars, key metrics. |
