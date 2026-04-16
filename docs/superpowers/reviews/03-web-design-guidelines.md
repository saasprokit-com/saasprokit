# Web Design Guidelines Review -- 2026-04-16

## Summary
- Total findings: 48
- Critical: 5 | High: 14 | Medium: 18 | Low: 11

Review standards: [Vercel Labs Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines) and project `DESIGN.md`.

---

## Findings

### [CRITICAL] -- accessibility/aria-live -- sign-in-client.tsx:172-180
**What:** Error and success messages rendered dynamically (magic link success, OTP sent, error states) have no `aria-live` region. Screen readers will not announce these state changes.
**Fix:** Wrap the error/success message containers with `aria-live="polite"` and `role="status"`.
**Impact:** Users relying on assistive technology will not know if their action succeeded or failed.

---

### [CRITICAL] -- accessibility/aria-live -- sign-in-form.tsx:85-88
**What:** The root form error alert (`bg-destructive/10` div) lacks `role="alert"` or `aria-live="assertive"`. When a sign-in fails, screen readers are not informed.
**Fix:** Add `role="alert"` to the error container div.
**Impact:** Form submission errors are invisible to assistive technology users.

---

### [CRITICAL] -- accessibility/aria-live -- sign-up-form.tsx:98-102
**What:** Same issue as sign-in-form: root error container has no ARIA live region.
**Fix:** Add `role="alert"` to the error container div.
**Impact:** Sign-up errors invisible to screen readers.

---

### [CRITICAL] -- design-md/gradient-violation -- hero.tsx:43
**What:** The Hero block component uses `bg-gradient-to-b from-primary/5 via-background to-background` when `showGradientBackground` is true (which is the default). DESIGN.md explicitly forbids gradients: "No gradients in either mode."
**Fix:** Remove the gradient background. Replace with flat background or use the grid system as the visual pattern (per DESIGN.md: "the grid IS the decoration").
**Impact:** Directly contradicts the core design principle of "brutally minimal" aesthetic.

---

### [CRITICAL] -- design-md/decorative-blob -- hero.tsx:116-118
**What:** Background decoration uses a large blurred circle (`rounded-full bg-primary/5 blur-3xl`). DESIGN.md anti-patterns list: "Decorative blobs, waves, or SVG dividers" and "Background patterns (the grid guides ARE the pattern)."
**Fix:** Remove the decorative blob element entirely.
**Impact:** Violates two explicit anti-patterns from DESIGN.md.

---

### [HIGH] -- design-md/border-radius -- card.tsx:10
**What:** Card component has `rounded-xl` hardcoded in its base class. DESIGN.md states: "Border radius: 0 everywhere (`--radius: 0rem`)" and anti-patterns include "Rounded corners (radius is 0 by default)."
**Fix:** Replace `rounded-xl` with `rounded-lg` which maps to `var(--radius)` (which is `0rem` by default). This ensures the Card respects the CSS variable.
**Impact:** Cards appear with rounded corners despite the design system mandating sharp edges.

---

### [HIGH] -- design-md/shadow -- card.tsx:10
**What:** Card component includes `shadow-sm` in base classes. DESIGN.md anti-patterns: "Card shadows (use borders instead)."
**Fix:** Remove `shadow-sm` from the Card component. The border is already present and sufficient.
**Impact:** Contradicts the design spec; borders alone should provide visual structure.

---

### [HIGH] -- design-md/shadow -- sign-in-client.tsx:164
**What:** Magic link tab content uses `shadow-sm` on its container: `"rounded-lg border bg-card p-6 shadow-sm"`.
**Fix:** Remove `shadow-sm`. Use border only for visual definition.
**Impact:** Inconsistent with DESIGN.md shadow prohibition.

---

### [HIGH] -- design-md/border-radius -- sign-in-client.tsx:164
**What:** Magic link container uses `rounded-lg`. With `--radius: 0rem`, `rounded-lg` resolves to `0` which is correct, but `rounded-lg` is still used elsewhere inconsistently alongside hardcoded `rounded-md`. More importantly, `rounded-lg` inside a `--radius: 0` system makes intent unclear.
**Fix:** Audit all `rounded-*` usage for consistency. Use the design token (`rounded-lg` resolving via `--radius`) consistently, and remove any hardcoded `rounded-md` or `rounded-xl` that bypass the variable.
**Impact:** Mixed radius approaches create confusion and potential visual inconsistency.

---

### [HIGH] -- design-md/shadow -- sign-in-client.tsx:216
**What:** OTP tab content also uses `shadow-sm` on its container.
**Fix:** Remove `shadow-sm`.
**Impact:** Same shadow violation as magic link tab.

---

### [HIGH] -- design-md/centered-layout -- hero.tsx:47
**What:** Hero block centers all content (`text-center` on the container). DESIGN.md anti-patterns: "Centered everything -- left-align by default."
**Fix:** Left-align the hero content. The homepage `home-page-client.tsx` already has a correctly left-aligned hero; this reusable Hero block should follow suit.
**Impact:** Reusable Hero component does not follow the project's alignment convention.

---

### [HIGH] -- design-md/shadow -- pricing.tsx:108
**What:** Popular pricing tier uses `shadow-lg ring-2 ring-primary`. DESIGN.md prohibits card shadows and the ring creates a colored highlight that is not part of the minimal border-based visual language.
**Fix:** Replace with a border-based highlight: `border-2 border-primary` or `border-foreground`.
**Impact:** Shadow violates DESIGN.md; ring deviates from the 1px-solid-border aesthetic.

---

### [HIGH] -- design-md/centered-layout -- pricing.tsx:64
**What:** Pricing section uses `text-center` for all content. Same anti-pattern as hero.
**Fix:** Left-align or use grid-based layout consistent with the homepage pricing section.
**Impact:** Violates left-align-by-default convention.

---

### [HIGH] -- forms/spellcheck -- sign-in-client.tsx:187-194
**What:** Email input in magic link form is missing `spellCheck={false}`. Web Interface Guidelines: "Disable spellcheck on emails, codes, usernames."
**Fix:** Add `spellCheck={false}` to the email input.
**Impact:** Browser spellcheck may flag email addresses as misspelled, creating visual noise.

---

### [HIGH] -- forms/spellcheck -- sign-in-form.tsx:98-104
**What:** Email input missing `spellCheck={false}`.
**Fix:** Add `spellCheck={false}` to the email Input component.
**Impact:** Same spellcheck noise on email fields.

---

### [HIGH] -- forms/spellcheck -- sign-up-form.tsx:130-136
**What:** Email input missing `spellCheck={false}`.
**Fix:** Add `spellCheck={false}` to the email Input component.
**Impact:** Same spellcheck noise on email fields.

---

### [HIGH] -- forms/autocomplete -- sign-in-client.tsx:187-194
**What:** Magic link email input is missing `autoComplete="email"`.
**Fix:** Add `autoComplete="email"`.
**Impact:** Browser autofill will not assist users with email entry.

---

### [HIGH] -- forms/autocomplete -- sign-in-client.tsx:276-284
**What:** OTP email input is missing `autoComplete="email"`.
**Fix:** Add `autoComplete="email"`.
**Impact:** Browser autofill will not assist users with email entry on the OTP form.

---

### [MEDIUM] -- typography/ellipsis -- sign-in-client.tsx:199
**What:** Loading state uses `"Sending..."` (three dots) instead of `"Sending..."` (ellipsis character). Web Interface Guidelines: "use `...` not `...`; Loading states end with `...`."
**Fix:** Replace `"Sending..."` with `"Sending\u2026"`, `"Verifying..."` with `"Verifying\u2026"`, `"Signing in..."` with `"Signing in\u2026"`.
**Impact:** Typographic inconsistency. Minor visual difference but violates guidelines.

---

### [MEDIUM] -- typography/ellipsis -- sign-in-form.tsx:157
**What:** `"Signing in..."` uses three dots instead of ellipsis character.
**Fix:** Replace with `"Signing in\u2026"`.
**Impact:** Same as above.

---

### [MEDIUM] -- typography/ellipsis -- sign-up-form.tsx:183
**What:** `"Creating account..."` uses three dots instead of ellipsis character.
**Fix:** Replace with `"Creating account\u2026"`.
**Impact:** Same as above.

---

### [MEDIUM] -- typography/ellipsis -- home-page-client.tsx:326
**What:** The configurator description uses `"Try it now..."` with three dots instead of an ellipsis character.
**Fix:** Replace with `"Try it now\u2026"`.
**Impact:** Typographic inconsistency on the most visible page.

---

### [MEDIUM] -- animation/transition-all -- button.tsx:8
**What:** Button base class includes `transition-all`. Web Interface Guidelines anti-pattern: "Never `transition: all` -- list properties explicitly."
**Fix:** Replace `transition-all` with explicit properties: `transition-colors` or `transition-[background-color,border-color,color,opacity]`.
**Impact:** `transition-all` can cause unexpected property animations and performance overhead.

---

### [MEDIUM] -- animation/transition-all -- sidebar.tsx:484
**What:** `sidebarMenuButtonVariants` base class includes broad transition on `transition-[width,height,padding]` which is acceptable, but the outline variant uses `shadow-[0_0_0_1px_hsl(...)]` with a hover shadow change. Shadows are not compositor-friendly properties. However, this is standard shadcn/ui behavior.
**Fix:** Consider using border instead of box-shadow for outline variant, consistent with DESIGN.md border-based approach.
**Impact:** Minor performance concern; shadow transitions are not compositor-friendly.

---

### [MEDIUM] -- animation/prefers-reduced-motion -- mode-toggle.tsx:35-36
**What:** Sun/Moon icon animations (`transition-all`, `rotate-0`, `scale-100`, etc.) do not honor `prefers-reduced-motion`. Web Interface Guidelines: "Honor `prefers-reduced-motion`."
**Fix:** Wrap the transition with `motion-safe:` prefix or add a `prefers-reduced-motion` media query that removes the rotation/scale transitions.
**Impact:** Users who prefer reduced motion will still see rotation animations.

---

### [MEDIUM] -- animation/transition-all -- mode-toggle.tsx:35
**What:** Uses `transition-all` on both Sun and Moon icon animations.
**Fix:** Replace with specific properties: `transition-[transform,opacity]`.
**Impact:** Animating all properties is wasteful and can cause unexpected side effects.

---

### [MEDIUM] -- design-md/color -- sign-in-client.tsx:137
**What:** Auth pages use `bg-gray-50 dark:bg-gray-900` for the background. DESIGN.md specifies backgrounds as `#fafafa` (light) / `#0a0a0a` (dark), which map to the CSS variable `--background`. Using Tailwind gray scale bypasses the design token system.
**Fix:** Replace `bg-gray-50 dark:bg-gray-900` with `bg-background`.
**Impact:** Background color will not respond to the style configurator's base color changes, and diverges from the design system tokens.

---

### [MEDIUM] -- design-md/color -- sign-up-client.tsx:43
**What:** Same issue: `bg-gray-50 dark:bg-gray-900` instead of `bg-background`.
**Fix:** Replace with `bg-background`.
**Impact:** Same as above.

---

### [MEDIUM] -- design-md/violet-anti-pattern -- color-presets.ts:288-300
**What:** Violet is included as an accent color option. DESIGN.md anti-patterns: "Purple/violet anything."
**Fix:** Remove the violet accent option from the configurator, or add a note in DESIGN.md that the configurator intentionally demonstrates options beyond the default palette.
**Impact:** The configurator allows selecting a color the design system explicitly forbids.

---

### [MEDIUM] -- forms/placeholder-pattern -- sign-in-form.tsx:129
**What:** Password placeholder says "Enter your password" without ending with an ellipsis. Web Interface Guidelines: "Placeholders end with `...` and show example pattern."
**Fix:** Change to `"Enter your password\u2026"` or better yet a pattern hint.
**Impact:** Placeholder does not follow the guideline convention.

---

### [MEDIUM] -- forms/placeholder-pattern -- sign-up-form.tsx:153
**What:** Password placeholder says "Create a strong password" without ellipsis.
**Fix:** Change to `"Create a strong password\u2026"`.
**Impact:** Same as above.

---

### [MEDIUM] -- forms/placeholder-pattern -- sign-up-form.tsx:174
**What:** Confirm password placeholder says "Confirm your password" without ellipsis.
**Fix:** Change to `"Confirm your password\u2026"`.
**Impact:** Same as above.

---

### [MEDIUM] -- accessibility/heading-hierarchy -- home-page-client.tsx:269-411
**What:** The homepage has a single `<h1>` (correct) but then jumps to `<h2>` for "Make it yours" (line 323), then `<h3>` for features and pricing plans. However, the "What you get" sidebar (line 298) uses a `<p>` tag for what functions as a section label. This is acceptable but could be improved with `<h2>` for the conceptual sections.
**Fix:** Consider adding visually-hidden `<h2>` elements before each major section (Features, Tech Stack, Pricing) for screen reader navigation, or use landmark roles.
**Impact:** Screen reader users may have difficulty navigating between major page sections.

---

### [MEDIUM] -- accessibility/skip-link -- home-page-client.tsx:264
**What:** No skip-to-content link at the top of the page. Web Interface Guidelines: "include skip link for main content."
**Fix:** Add a visually-hidden skip link as the first focusable element: `<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to content</a>`.
**Impact:** Keyboard-only users must tab through the entire header to reach page content.

---

### [MEDIUM] -- touch/touch-action -- button.tsx:8
**What:** Button component does not set `touch-action: manipulation`. Web Interface Guidelines: "prevents double-tap zoom delay."
**Fix:** Add `touch-action-manipulation` to the button base classes.
**Impact:** 300ms tap delay on mobile devices that support double-tap zoom.

---

### [MEDIUM] -- forms/controlled-inputs -- sign-in-client.tsx:187-194
**What:** Magic link email input is a controlled input (`value={magicLinkEmail}`) without debouncing. Same for OTP email and OTP code inputs. The Web Interface Guidelines recommend: "Prefer uncontrolled inputs; controlled inputs must be cheap per keystroke."
**Fix:** These are simple state updates without expensive computations, so this is likely fine. However, consider using `defaultValue` + `ref` for the email fields, or ensure the `onChange` handlers are cheap (they are simple `setState` calls, so this is acceptable).
**Impact:** Low practical impact since the handlers are trivial, but noted for pattern awareness.

---

### [MEDIUM] -- design-md/font-weight -- hero.tsx:53
**What:** Hero title uses `font-bold` (700). DESIGN.md specifies hero/display text should use weight 600 (semibold), not 700.
**Fix:** Change `font-bold` to `font-semibold`.
**Impact:** Hero text is heavier than the design system specifies.

---

### [LOW] -- typography/text-wrap -- home-page-client.tsx:269
**What:** The `<h1>` heading does not use `text-wrap: balance` or `text-pretty`. Web Interface Guidelines: "Use `text-wrap: balance` or `text-pretty` on headings (prevents widows)."
**Fix:** Add `text-balance` or `text-pretty` class to the `<h1>`.
**Impact:** Heading may have orphaned words on certain viewport widths.

---

### [LOW] -- typography/text-wrap -- hero.tsx:53
**What:** Same issue: `<h1>` in the reusable Hero does not use `text-wrap: balance`.
**Fix:** Add `text-balance` or `text-pretty` class.
**Impact:** Same as above.

---

### [LOW] -- typography/text-wrap -- pricing.tsx:71
**What:** Pricing `<h2>` heading lacks `text-balance`.
**Fix:** Add `text-balance` class.
**Impact:** Minor typographic orphan issue.

---

### [LOW] -- content/copy-voice -- sign-in-client.tsx:167-169
**What:** Magic link description says "We'll send you a link..." (first person). Web Interface Guidelines: "Second person; avoid first person."
**Fix:** Rephrase to "A link will be sent to your email" or "You'll receive a sign-in link."
**Impact:** Minor copy style inconsistency.

---

### [LOW] -- content/copy-voice -- sign-in-client.tsx:221
**What:** OTP description uses "We'll send you a one-time code" (first person).
**Fix:** Change to "A one-time code will be sent to your email" or "You'll receive a one-time code."
**Impact:** Minor copy style inconsistency.

---

### [LOW] -- hydration/date-mismatch -- footer.tsx:44
**What:** `new Date().getFullYear()` is called in a client component, which can cause hydration mismatch if the server renders at year boundary differently than client. This is a theoretical edge case.
**Fix:** Use `suppressHydrationWarning` on the copyright paragraph, or compute the year server-side and pass as prop (which the homepage already does via the `copyright` prop).
**Impact:** Extremely unlikely to cause issues in practice; noted for completeness.

---

### [LOW] -- hydration/date-mismatch -- simple-footer.tsx:25
**What:** Same `new Date().getFullYear()` concern as footer.tsx.
**Fix:** Same as above.
**Impact:** Same as above.

---

### [LOW] -- design-md/spacing -- home-page-client.tsx:353
**What:** Feature blocks use `p-8` (32px). DESIGN.md specifies section padding minimum of `p-10` (40px).
**Fix:** Change `p-8` to `p-10` to meet the minimum section padding specification.
**Impact:** Slightly tighter spacing than the design system specifies. Minor visual difference.

---

### [LOW] -- design-md/spacing -- home-page-client.tsx:377
**What:** Tech stack blocks use `p-8` (32px), below the 40px minimum.
**Fix:** Change `p-8` to `p-10`.
**Impact:** Same as above.

---

### [LOW] -- accessibility/color-scheme -- globals.css:218-223
**What:** `color-scheme: dark` is set on `.dark` class and `color-scheme: light` on `.light` class. The Web Interface Guidelines recommend setting this on `<html>`. The `.dark` class is typically applied to `<html>`, so this should work, but there is no `.light` class applied by default (only `.dark` or absence of it). The `:root` should have `color-scheme: light dark` for system-default support.
**Fix:** Add `color-scheme: light dark` to `:root` and keep the overrides on `.dark` and `.light`. Or verify that `next-themes` applies `.light` explicitly.
**Impact:** Browser chrome (scrollbars, form controls) may not correctly reflect the light theme if `.light` is never applied.

---

### [LOW] -- navigation/url-state -- home-page-client.tsx:238-240
**What:** The style configurator state (accent color, radius, font, density) is stored in React state only. Web Interface Guidelines: "URL reflects state" and "Deep-link all stateful UI."
**Fix:** Consider syncing configurator state to URL query params (e.g., `?accent=amber&radius=0.5`) so that configurations can be shared via URL. Could use `nuqs` for URL state management.
**Impact:** Users cannot share or bookmark a specific configuration. This is an enhancement rather than a bug.

---

---

## Files Passing Review (no findings)

- `packages/design-system/components/ui/grid.tsx` -- Well-structured, proper `aria-hidden` on decorative elements, correct use of semantic HTML.
- `packages/design-system/components/ui/form.tsx` -- Proper label association via `htmlFor`, `aria-describedby`, `aria-invalid` attributes. Follows accessibility best practices.
- `packages/design-system/components/molecules/footer/simple-footer.tsx` -- Clean, uses proper semantic elements, links use `<Link>`.
- `packages/design-system/components/blocks/style-configurator/use-style-config.ts` -- Pure logic hook, no UI concerns.
- `packages/design-system/components/blocks/style-configurator/color-presets.ts` -- Data file (except violet inclusion noted above).

---

## Summary by Category

| Category | Count |
|----------|-------|
| DESIGN.md violations | 16 |
| Accessibility (ARIA/a11y) | 8 |
| Forms (autocomplete, spellcheck, placeholders) | 8 |
| Typography (ellipsis, text-wrap, copy) | 9 |
| Animation (transition-all, reduced-motion) | 4 |
| Other (hydration, URL state, touch) | 3 |
