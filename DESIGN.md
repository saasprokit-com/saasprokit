# Design System — SaaSProKit

**This file holds rules and pointers, never values.** Colors, radii, spacing and font
choices live in CSS, and this is a boilerplate — you are expected to change all of them. A
line here that would go stale when you edit a token does not belong here.

Earlier versions of this file listed a palette and a type scale. They drifted out of sync with
the code and misled anyone who trusted them, which is the failure this format exists to
prevent.

## Where things actually live

| What | File |
|---|---|
| Default tokens (light + dark) | `packages/design-system/styles/globals.css` — the `:root` and `.dark` blocks |
| Design presets | `packages/design-system/styles/design-presets.css` |
| Font loading | `packages/design-system/lib/fonts.ts` |
| Preset switching | `packages/design-system/providers/design-preset.tsx` |
| Motion presets | `packages/design-system/components/blocks/motion-presets.ts` |
| Reduced motion | `packages/design-system/providers/motion.tsx` |
| Marketing blocks | `packages/design-system/components/blocks/` |
| Primitives | `packages/design-system/components/ui/` (shadcn `new-york`) |

Read the file, not this table, for any actual value.

## Re-theming for your product

The presets are runtime-switchable via `:root[data-design="<name>"]`, with dark variants at
`:root.dark[data-design="<name>"]`. Preset specificity `(0,2,1)` intentionally beats the
`:root` defaults in `globals.css`.

To make the kit yours:

1. **Brand color** — change `--primary` (and `--primary-foreground` for contrast) in the
   `:root` and `.dark` blocks of `globals.css`. If you use presets, change it in each preset
   block you actually ship.
2. **Corner style** — `--radius`, same places. Presets override it per theme.
3. **Typeface** — add the family to `lib/fonts.ts` via `next/font`, then point `--font-sans`
   at the variable it creates. See the font rule below before reaching for a `<link>`.
4. **Density** — `--density-scale` in the preset blocks.
5. **Delete the presets you don't ship.** Multiple themes are a demo feature; a real product
   picks one. Removing the rest shrinks the CSS and the decision surface.

## Rules

These survive re-theming. Break them and things quietly stop working.

### Fonts must be self-hosted

Load every family through `next/font` in `lib/fonts.ts`, and reference it by the CSS variable
it generates. **Never add `@import url(...)` from the Google Fonts CDN**, and never add a
`<link rel="preconnect">` to a font host. Three reasons:

- CSS `@import` is render-blocking, and a font host is a third-party round trip before first
  paint.
- The CDN sends every visitor's IP to Google. A 2022 Munich ruling found that needs consent
  or self-hosting, and the kit sells into the EU.
- `apps/web/middleware.ts` sets `style-src` and `font-src` to `'self'`. A CDN font would be
  blocked outright unless you reopen the CSP, which is the wrong trade.

`fonts` from `lib/fonts.ts` must be applied to `<body>` in the root layout. It is what defines
the font variables — without it, `--font-sans` resolves to nothing and every `font-sans`
utility silently falls back to the browser default.

**Known gap:** Storybook renders in the browser default sans, not your app's typeface.
Importing `lib/fonts.ts` there pulls in `next/font`, which the Vite builder cannot resolve.
Matching it needs a plain `@font-face` declaration in the Storybook preview.

### Monospace is for code and data

Use `font-mono` for content that is literally code, identifiers, versions or tabular figures.
Setting headings in mono is the most common look in developer tooling and signals nothing.

### One accent color

`--primary` is the only chromatic token. Everything else is the neutral scale. A second accent
is what makes a palette read as unplanned — if something needs emphasis, use weight, size or
space.

### Motion

Import from `blocks/motion-presets.ts`; never redeclare easing or variants locally. They were
copy-pasted into two files once already.

- **Opacity and transform only.** Anything that triggers layout is off-limits.
- **`viewport={{ once: true }}` on every scroll trigger.** Re-animating on scroll-back reads
  as a glitch.
- **No parallax, no scroll-linked effects.**
- **Reduced motion is global.** `MotionProvider` sets `MotionConfig reducedMotion="user"`,
  which suppresses transform animations for visitors who ask for it while keeping opacity
  fades. Components do not need their own check unless they animate outside framer-motion.

### Match the shipped blocks

New sections should sit alongside the existing ones without looking imported from elsewhere.
Read two or three blocks in `components/blocks/` and follow what they do for section padding,
container width and heading sizes. They are consistent; copying them is cheaper than inventing
a parallel scale.

## Decisions log

- **2026-07-31** — Rewrote this file to hold rules and pointers only. It had specified a
  palette and type scale that were never implemented, and a values-based rewrite would have
  drifted again the first time anyone edited a token or switched preset.
- **2026-07-31** — Moved Inter, DM Sans and Plus Jakarta Sans from Google CDN `@import` to
  self-hosted `next/font`, and tightened `style-src`/`font-src` to `'self'`. The three
  families are used by the non-Geist presets; the CDN imports were also render-blocking and a
  GDPR exposure.
- **2026-07-31** — Fixed `fonts` never being applied to `<body>`, which meant Geist had never
  rendered in the web app despite being a dependency.
- **2026-07-31** — Added global reduced-motion support. Nothing in the codebase respected the
  setting except a CSS smooth-scroll guard.
