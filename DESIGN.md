# Design System

Everything visual in this kit comes from shadcn/ui (`new-york`) plus a small set of CSS
tokens. This page shows you how to make it look like your product, and the few rules worth
following so things keep working.

Values live in CSS, not here — change them freely.

## Make it yours

Start here. Fifteen minutes gets you off the default look.

**1. Pick your brand color.** Open `packages/design-system/styles/globals.css` and change
`--primary` in both the `:root` and `.dark` blocks. Set `--primary-foreground` to whatever
reads clearly on top of it. Tokens are OKLCH — [oklch.com](https://oklch.com) converts from
hex and makes picking a matching dark-mode value much easier than juggling HSL.

**2. Set your corner style.** `--radius`, same two blocks. `0rem` for sharp, `0.5rem` for
soft, anything in between.

**3. Choose a typeface.** Add it to `packages/design-system/lib/fonts.ts` using `next/font`,
then point `--font-sans` at the variable it creates:

```ts
const brand = Inter({ subsets: ['latin'], variable: '--font-brand', display: 'swap' });

export const fonts = cn(brand.variable, /* … */);
```

```css
--font-sans: var(--font-brand), sans-serif;
```

**4. Check it took.** `.font-sans` compiles to the resolved value, so a stray
`--font-sans` override elsewhere will not do anything — change it in `@theme inline` in
`globals.css` and confirm in DevTools that `.font-sans` resolves to your variable.

## Where things live

| What | Where |
|---|---|
| Color, radius, spacing tokens | `packages/design-system/styles/globals.css` |
| Font loading | `packages/design-system/lib/fonts.ts` |
| Animation presets | `packages/design-system/components/blocks/motion-presets.ts` |
| Reduced-motion handling | `packages/design-system/providers/motion.tsx` |
| Marketing sections | `packages/design-system/components/blocks/` |
| shadcn primitives | `packages/design-system/components/ui/` |

## Things that will bite you

**Fonts have to be self-hosted.** Load every family through `next/font` and reference the
variable it generates. Do not add `@import url(...)` from Google Fonts or a `<link
rel="preconnect">` to a font host — `apps/web/middleware.ts` sets `style-src` and `font-src`
to `'self'`, so a CDN font is blocked outright. Self-hosting is also faster (no third-party
round trip before first paint) and avoids sending every visitor's IP to Google, which matters
if you sell into the EU.

**`fonts` must be on every `<body>`.** It is what defines the font CSS variables. Leave it off
and `--font-sans` resolves to nothing, every `font-sans` class silently falls back to the
browser default, and your typeface never appears. The app has two: `app/layout.tsx` and
`app/global-error.tsx`, which renders its own document and bypasses the root layout entirely.
Add a `<body>` anywhere else and it needs `fonts` too.

**Storybook renders in the default sans**, not your app's typeface. Importing `lib/fonts.ts`
there pulls in `next/font`, which Storybook's Vite builder cannot resolve. If matching fonts
in Storybook matters to you, add a plain `@font-face` to `.storybook/preview.tsx`.

## Conventions worth keeping

**Monospace is for code and data.** Identifiers, versions, tabular figures — content that is
literally code. Headings in mono is the most common look in developer tooling and says
nothing about your product.

**One accent color.** `--primary` is the only chromatic token; everything else is the neutral
scale. If something needs emphasis, reach for weight, size or space before adding a second
color.

**Animate with the shared presets.** Import `EASE` and the variants from
`blocks/motion-presets.ts` rather than defining them per component, so timing stays consistent
as you add sections. Stick to opacity and transform — anything that triggers layout will
stutter. Put `viewport={{ once: true }}` on scroll triggers; replaying on scroll-back reads as
a glitch.

Reduced motion is already handled globally by `MotionProvider`, which suppresses transform
animations for visitors who ask for it while keeping fades. You do not need a per-component
check unless you animate outside framer-motion.

**New sections should match the existing ones.** Before building one, read two or three blocks
in `components/blocks/` and follow their section padding, container width and heading sizes.
Copying what is there is quicker than inventing a parallel scale, and the page stays coherent.
