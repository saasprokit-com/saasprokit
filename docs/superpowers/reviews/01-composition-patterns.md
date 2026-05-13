# Composition Patterns Review -- 2026-04-16

## Summary
- Total findings: 18
- Critical: 0 | High: 5 | Medium: 8 | Low: 5

## Findings

### HIGH -- react19-use-instead-usecontext -- packages/design-system/components/ui/sidebar.tsx:48
**What:** `useSidebar()` uses `React.useContext(SidebarContext)` instead of the React 19 `use()` API.
**Fix:** Replace `React.useContext(SidebarContext)` with `React.use(SidebarContext)`. The `use()` API works with context and is the idiomatic React 19 approach.
**Impact:** Misses React 19 benefits -- `use()` can be called conditionally and aligns with the new mental model. This is the largest compound component in the system (728 lines), so it sets the pattern for other components.

---

### HIGH -- react19-use-instead-usecontext -- packages/design-system/components/ui/form.tsx:46-47
**What:** `useFormField()` calls `React.useContext(FormFieldContext)` and `React.useContext(FormItemContext)` -- two separate `useContext` calls in the same hook.
**Fix:** Replace both with `React.use(FormFieldContext)` and `React.use(FormItemContext)`.
**Impact:** Form is a core compound component used across every form in the app. Updating it sets the standard for all form consumers.

---

### HIGH -- react19-use-instead-usecontext -- packages/design-system/components/ui/carousel.tsx:36
**What:** `useCarousel()` uses `React.useContext(CarouselContext)`.
**Fix:** Replace with `React.use(CarouselContext)`.
**Impact:** Carousel is a compound component with multiple subcomponents (CarouselContent, CarouselItem, CarouselPrevious, CarouselNext) all consuming this context.

---

### HIGH -- react19-use-instead-usecontext -- packages/design-system/components/ui/chart.tsx:28
**What:** `useChart()` uses `React.useContext(ChartContext)`.
**Fix:** Replace with `React.use(ChartContext)`.
**Impact:** Chart components are data-heavy; using the modern API is a low-effort win.

---

### HIGH -- react19-use-instead-usecontext -- packages/design-system/components/ui/toggle-group.tsx:59
**What:** `ToggleGroupItem` uses `React.useContext(ToggleGroupContext)` directly inside the component body instead of through a named hook.
**Fix:** Replace with `React.use(ToggleGroupContext)`. Additionally, extract a `useToggleGroup()` hook for consistency with the pattern used by Sidebar, Carousel, and Chart.
**Impact:** Inconsistent with other compound components that use named hooks. Inline context access is harder to trace and test.

---

### MEDIUM -- react19-use-instead-usecontext -- packages/design-system/components/layout/breadcrumb-context.tsx:37
**What:** `useBreadcrumbContext()` uses `useContext(BreadcrumbContext)`.
**Fix:** Replace with `use(BreadcrumbContext)` from React.
**Impact:** Lower priority since this is a layout utility, but should be updated for consistency.

---

### MEDIUM -- react19-use-instead-usecontext -- packages/design-system/components/ui/input-otp.tsx:46
**What:** `InputOTPSlot` uses `React.useContext(OTPInputContext)` to access the third-party `input-otp` context.
**Fix:** Replace with `React.use(OTPInputContext)`. Verify the `input-otp` library exports the context in a way compatible with `use()` (it should, as it is a standard React context).
**Impact:** Minor; depends on the third-party library's context export.

---

### MEDIUM -- architecture-avoid-boolean-props -- packages/design-system/components/ui/sidebar.tsx:499-557
**What:** `SidebarMenuButton` accepts 3 boolean props: `asChild`, `isActive`, and implicitly through the `tooltip` prop (which changes rendering). `SidebarMenuAction` accepts `asChild` and `showOnHover` (2 booleans). Combined, `SidebarMenuButton` has 2^2 = 4 boolean states plus variant/size combinatorics.
**Fix:** `isActive` is a data attribute for styling, which is acceptable. `showOnHover` on `SidebarMenuAction` is a visual-only modifier and could be an explicit variant (`variant: "hover-reveal" | "always-visible"`), but the current usage is contained. No immediate refactor needed, but monitor for growth.
**Impact:** Moderate -- the boolean count is at the threshold. Adding one more boolean would clearly cross the line.

---

### MEDIUM -- architecture-avoid-boolean-props -- packages/design-system/components/ui/chart.tsx:107-128
**What:** `ChartTooltipContent` accepts 3 boolean-like props: `hideLabel`, `hideIndicator`, and `indicator` (which is a 3-value enum but controls visibility). Two of these (`hideLabel`, `hideIndicator`) are negative booleans that invert mental models.
**Fix:** Consider replacing `hideLabel`/`hideIndicator` with a positive `show` pattern or a `parts` object: `parts={{ label: true, indicator: true }}`. Alternatively, use explicit variant names like `indicator="none"` to cover the hidden case.
**Impact:** Negative boolean props (`hide*`) require double-negation reasoning ("not hidden" = visible). This makes the API harder to read at call sites.

---

### MEDIUM -- architecture-avoid-boolean-props -- packages/design-system/components/ui/chart.tsx:255-265
**What:** `ChartLegendContent` accepts `hideIcon` boolean prop, continuing the negative-boolean pattern.
**Fix:** Same as above -- prefer `showIcon` or fold into a `parts` config.
**Impact:** Consistency issue with the broader chart API.

---

### MEDIUM -- architecture-avoid-boolean-props -- packages/design-system/components/ui/sidebar.tsx:604-609
**What:** `SidebarMenuSkeleton` accepts `showIcon` boolean. This controls whether an icon placeholder skeleton is rendered.
**Fix:** Could be replaced with a children/slot approach where callers compose the skeleton layout, but for a skeleton component the boolean is pragmatic and contained. Low urgency.
**Impact:** Minor -- skeleton components are inherently simple and rarely composed further.

---

### MEDIUM -- architecture-avoid-boolean-props -- packages/design-system/components/blocks/hero/hero.tsx:27
**What:** `HeroProps` includes `showGradientBackground` boolean, which toggles both a CSS class on the container and renders a decorative background div. This boolean controls rendering logic, not just styling.
**Fix:** Split into two explicit variants: `<Hero variant="gradient">` and `<Hero variant="plain">`, or better yet, use composition -- make the gradient background a separate `<HeroBackground>` child component that consumers can include or omit.
**Impact:** The Hero component already has a large props surface (badge, title, highlightedText, subtitle, primaryCta, secondaryCta, benefits, showGradientBackground, className, id). Adding more booleans would make it unwieldy.

---

### MEDIUM -- patterns-children-over-render-props -- packages/design-system/components/blocks/hero/hero.tsx:6-27
**What:** The Hero component accepts structured data props (`primaryCta`, `secondaryCta`, `benefits[]`) and renders them internally. This is a props-driven monolithic API rather than a compositional one.
**Fix:** Refactor to a compound component pattern:
```tsx
<Hero>
  <HeroBadge>Production Ready</HeroBadge>
  <HeroTitle>The SaaS Boilerplate That <HeroHighlight>Ships Fast</HeroHighlight></HeroTitle>
  <HeroSubtitle>Production-ready foundation...</HeroSubtitle>
  <HeroActions>
    <Button>Get Started</Button>
    <Button variant="outline">GitHub</Button>
  </HeroActions>
  <HeroBenefits>
    <HeroBenefit>TypeScript end-to-end</HeroBenefit>
  </HeroBenefits>
</Hero>
```
This gives callers full control over rendering without the component needing to know about Link, Badge, or Button internals.
**Impact:** The current API forces consumers to conform to the component's rendering decisions. The homepage (`home-page-client.tsx`) already bypasses this Hero entirely and builds its own hero section inline, which is evidence the props-driven API was not flexible enough.

---

### MEDIUM -- state-decouple-implementation -- packages/design-system/components/blocks/style-configurator/use-style-config.ts:20
**What:** `useStyleConfig` hook uses `useState` directly and returns raw state + updaters. The CSS variable computation is coupled to the hook, meaning UI components must use this specific hook implementation.
**Fix:** Define a `StyleConfigContext` with a provider component. The provider encapsulates how state is managed (could be useState, URL params, localStorage, Zustand). UI components consume the context interface: `{ config, updateConfig, reset, cssVars }`. This would also allow the `isDark` parameter to be derived from context rather than passed as a boolean argument.
**Impact:** Currently `home-page-client.tsx` manages the dark mode detection and passes `isDark` to the hook, creating tight coupling. A provider could observe the theme internally.

---

### LOW -- architecture-avoid-boolean-props -- packages/design-system/components/molecules/footer/footer.tsx:11
**What:** `FooterLink` type has an `external?: boolean` that controls whether to render an `<a>` tag or a Next.js `<Link>`.
**Fix:** Could use the `asChild` pattern or accept a render slot, but for a footer link data structure this is pragmatic and well-contained.
**Impact:** Minimal -- the boolean is in a data type, not a component prop, and the rendering branching is simple.

---

### LOW -- patterns-explicit-variants -- packages/design-system/components/ui/pagination.tsx:40-41
**What:** `PaginationLink` uses `isActive?: boolean` which toggles between `"outline"` and `"ghost"` button variants.
**Fix:** Could accept `variant` directly, but `isActive` maps cleanly to `aria-current="page"` and is the standard pagination pattern. No change needed.
**Impact:** Negligible -- single boolean with clear semantic meaning tied to accessibility state.

---

### LOW -- state-context-interface -- packages/design-system/components/ui/sidebar.tsx:35-43
**What:** `SidebarContextProps` mixes state (`state`, `open`, `openMobile`, `isMobile`) with actions (`setOpen`, `setOpenMobile`, `toggleSidebar`) in a flat interface without grouping.
**Fix:** Structure the context interface with explicit groups:
```tsx
type SidebarContext = {
  state: { open: boolean; openMobile: boolean; isMobile: boolean; collapsed: boolean };
  actions: { setOpen: (open: boolean) => void; setOpenMobile: (open: boolean) => void; toggle: () => void };
};
```
This makes the contract clearer for consumers and enables better TypeScript narrowing.
**Impact:** Low urgency -- the current flat interface works fine for the existing consumer count. Worth refactoring if more consumers are added.

---

### LOW -- state-context-interface -- packages/design-system/components/layout/breadcrumb-context.tsx:17-20
**What:** `BreadcrumbContextValue` exposes raw `setItems` setter directly to consumers. This leaks the implementation detail that state is managed via `useState`.
**Fix:** Wrap mutations behind named actions: `{ items: BreadcrumbItem[]; push: (item: BreadcrumbItem) => void; replace: (items: BreadcrumbItem[]) => void; clear: () => void; }`.
**Impact:** Low -- the context has few consumers and the current API works. But if more mutation patterns emerge, the raw setter will become a footgun.

---

### LOW -- architecture-compound-components -- packages/design-system/components/molecules/footer/footer.tsx:25-33
**What:** `FooterProps` accepts structured data arrays (`sections`, `socialLinks`, `bottomLinks`) and renders everything internally. This is a props-driven approach rather than compound composition.
**Fix:** Could be refactored to:
```tsx
<Footer>
  <FooterBrand logo={logo} description={description} />
  <FooterSection title="Product">
    <FooterLink href="/docs">Documentation</FooterLink>
  </FooterSection>
  <FooterBottom copyright="...">
    <FooterLink href="/privacy">Privacy</FooterLink>
  </FooterBottom>
</Footer>
```
However, the current data-driven approach is reasonable for a footer since the structure is predictable and rarely needs custom rendering per-item.
**Impact:** Low -- footer data is static and the component is used in few places. The props-driven API is simpler for this use case.
