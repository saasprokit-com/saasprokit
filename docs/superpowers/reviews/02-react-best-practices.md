# React Best Practices Review — 2026-04-16

## Summary
- Total findings: 21
- Critical: 3 | High: 5 | Medium: 9 | Low: 4

## Findings

### CRITICAL — async-waterfalls — apps/web/app/[locale]/(app)/[orgSlug]/layout.tsx:23-35
**What:** Sequential waterfall: two `await Promise.all` blocks run in series. The second block (`requireAuth()` + `checkOrgPermission()`) waits for the first block (`validateOrgMembershipBySlug` + `getUserOrganizations`) to complete, even though `requireAuth()` is independent of both.
**Fix:** Merge into a single `Promise.all` with all four calls, or at minimum start `requireAuth()` in the first batch since it does not depend on `orgContext`.
```typescript
const [org, { organizations, defaultOrganizationId }, session, canManageBilling] =
  await Promise.all([
    validateOrgMembershipBySlug(orgSlug),
    getUserOrganizations(),
    requireAuth(),
    // checkOrgPermission needs orgId — keep it chained or use Promise pipeline
  ]);
```
**Impact:** Every page under the org layout pays for this serial waterfall on every navigation. This is the highest-traffic server component path.

---

### CRITICAL — async-waterfalls — apps/web/app/[locale]/(app)/[orgSlug]/page.tsx:21-24
**What:** Two sequential awaits — `validateOrgMembershipBySlug` then `getOrgDashboardData`. The dashboard data fetch waits for membership validation to finish.
**Fix:** Use Suspense boundary to stream the dashboard data. The membership validation is already needed for auth gating, but the dashboard data could be deferred via the `defer await` pattern (start the promise early, await in JSX via Suspense).
**Impact:** Dashboard page load is blocked by the membership query completing before the dashboard query even starts.

---

### CRITICAL — async-waterfalls — apps/web/app/[locale]/(app)/[orgSlug]/settings/page.tsx:18-27
**What:** Sequential waterfall: `validateOrgMembershipBySlug(orgSlug)` is awaited first, then `Promise.all([getOrgSettingsData, getDictionary, checkOrgPermission])`. The dict fetch and permission check do not depend on `orgContext` but wait for it anyway.
**Fix:** Start `getDictionary(locale)` in parallel with the first await since it only needs locale, not the org context.
```typescript
const [orgContext, dict] = await Promise.all([
  validateOrgMembershipBySlug(orgSlug),
  getDictionary(locale),
]);
const [organization, permissionResult] = await Promise.all([
  getOrgSettingsData(orgContext.organizationId),
  checkOrgPermission(orgContext.organizationId, { organization: ["update"] }),
]);
```
**Impact:** Dictionary fetch is unnecessarily serialized behind org validation on every settings page load.

---

### HIGH — bundle-barrel-imports — apps/web/app/[locale]/(frontier)/home-page-client.tsx:14-26
**What:** 12 individual icons imported from `lucide-react` in a single statement. While lucide-react supports tree-shaking, importing many icons from a single entry point can still increase the client bundle, especially when this is a "use client" component that ships all its code to the browser.
**Fix:** Consider importing from individual icon paths if lucide-react supports it, or use `next/dynamic` to lazily load the icon set. Alternatively, since these are static SVGs in the `techStack` array, consider inlining them as SVG strings (which is already done for the tech stack section) and removing the lucide-react dependency from this client bundle entirely.
**Impact:** All 12 icons and the lucide-react runtime are included in the homepage client bundle. This is the public-facing landing page where bundle size directly impacts LCP.

---

### HIGH — server-serialization — apps/web/app/[locale]/(frontier)/page.tsx:17
**What:** The server component passes `plans` (from `getAllPlans()`) as a prop to `HomePageClient`. The entire `PlanConfig[]` is serialized across the server-client boundary, including all plan metadata. The 505-line client component receives this but only uses `name`, `displayName`, `description`, `monthlyPrice`, `badge`, and `features` fields.
**Fix:** Select only the fields needed before passing to the client component, reducing serialization payload.
```typescript
const plans = getAllPlans().map(({ name, displayName, description, monthlyPrice, badge, features }) => 
  ({ name, displayName, description, monthlyPrice, badge, features }));
```
**Impact:** Unnecessary data shipped to the client on every homepage load. Affects initial page weight and hydration time.

---

### HIGH — server-dedup-props — apps/web/app/[locale]/(app)/[orgSlug]/layout.tsx:26-36
**What:** `validateOrgMembershipBySlug(orgSlug)` is called in the layout, and the same function is called again in child pages (e.g., `members/page.tsx:23`, `billing/page.tsx:25`, `settings/page.tsx:19`). While this may be deduplicated by `React.cache`, the `checkOrgPermission` and `requireAuth` calls in the layout are also duplicated across some child pages.
**Fix:** Verify that `validateOrgMembershipBySlug` is wrapped in `React.cache()`. If so, this is fine. If not, wrap it to ensure request-level deduplication. Consider passing org context through React context or a shared layout prop pattern to avoid the child pages needing to re-call it.
**Impact:** Without `React.cache`, this results in duplicate database queries per page render within the org scope.

---

### HIGH — bundle-dynamic-imports — apps/web/app/[locale]/(frontier)/home-page-client.tsx:3
**What:** The `StyleConfigurator` component is eagerly imported and rendered in the homepage client component, but it is hidden on mobile by default (`hidden lg:block`) and only shown when the user clicks "Show controls". This is a non-critical interactive widget that should be lazily loaded.
**Fix:** Use `next/dynamic` with `ssr: false` (or React.lazy) to defer loading the StyleConfigurator until it is needed:
```typescript
const StyleConfigurator = dynamic(
  () => import("@repo/design-system/components/blocks/style-configurator/style-configurator")
    .then(m => ({ default: m.StyleConfigurator })),
  { ssr: false }
);
```
**Impact:** Reduces the initial JS bundle for the homepage, improving FCP and TTI for the marketing-critical landing page.

---

### HIGH — async-waterfalls — apps/web/app/[locale]/(app)/account/new-org/page.tsx:22-27
**What:** Sequential awaits: `getServerSession()` + `getDictionary(locale)` run in parallel (good), but then `canUserCreateOrg(session!.user.id)` runs sequentially because it depends on the session. However, the `getDictionary` is awaited unnecessarily in that first batch — it could be started earlier.
**Fix:** This is a minor waterfall. The session is needed before the billing check, so the sequential pattern is partially justified. However, `canUserCreateOrg` could be started immediately after session resolves using a pipeline approach, rather than waiting for both session AND dict.
**Impact:** Minor — one extra round trip of latency on the new-org page.

---

### MEDIUM — rerender-derived-state-no-effect — packages/design-system/components/layout/org-switcher.tsx:61-69
**What:** The `OrgSwitcher` component uses `useState` + `useEffect` to sync `activeOrganization` prop into local `activeOrg` state. This is the classic "state synced from props via effect" anti-pattern that causes an extra re-render on every prop change.
**Fix:** Remove the local state and effect. Derive the active org directly:
```typescript
const activeOrg = activeOrganization ?? organizations[0] ?? null;
```
If you need the local override for user selection, use a controlled/uncontrolled pattern with a key reset or useCallback.
**Impact:** Extra re-render cycle on every org switch and mount. May cause a visible flash in the sidebar.

---

### MEDIUM — rerender-memo-with-default-value — packages/design-system/components/molecules/footer/footer.tsx:39-42
**What:** Default values for `sections`, `socialLinks`, and `bottomLinks` are defined as new array literals `[]` in the destructuring. Every render creates new reference-equal arrays, which breaks shallow comparison for any downstream `React.memo` or `useMemo` that depends on these props.
**Fix:** Hoist default values to module-level constants:
```typescript
const EMPTY_ARRAY: never[] = [];
// Then in destructuring:
sections = EMPTY_ARRAY, socialLinks = EMPTY_ARRAY, bottomLinks = EMPTY_ARRAY,
```
**Impact:** Low-to-medium. Footer re-renders are infrequent, but this is a best practice that prevents subtle bugs in memoized children.

---

### MEDIUM — rendering-hydration-no-flicker — packages/design-system/hooks/use-mobile.ts:7
**What:** `useIsMobile()` initializes with `null` and returns `false` until the effect runs. This causes a hydration mismatch: the server renders `false`, then the client may flip to `true` after mount, causing layout shift in mobile sidebar rendering.
**Fix:** Consider reading the initial value from a CSS media query result inline, or use `useSyncExternalStore` with `getServerSnapshot` returning a sensible default. Alternatively, render both mobile and desktop layouts server-side with CSS visibility and avoid the JS-based toggle.
**Impact:** Mobile users may see a brief layout flash as the sidebar switches from desktop to mobile mode after hydration.

---

### MEDIUM — rerender-no-inline-components — packages/design-system/components/layout/breadcrumb-context.tsx:56-65
**What:** The `useBreadcrumbs` hook creates a new `items` array reference on every call (passed as prop from server component). The `_itemsKey = JSON.stringify(items)` attempts to stabilize it but is not used in the effect dependency array — the actual `items` reference is used, defeating the purpose.
**Fix:** Use `_itemsKey` in the effect dependency array instead of `items`:
```typescript
useEffect(() => {
  setItems(items);
  return () => setItems([]);
}, [setItems, _itemsKey]); // use serialized key, not reference
```
Or better, remove the hook and use the `SetBreadcrumbs` component pattern exclusively (which is already what all pages do).
**Impact:** `SetBreadcrumbs` calls `useBreadcrumbs` which triggers an unnecessary re-render on every page navigation because the items reference changes even when the values are identical.

---

### MEDIUM — js-combine-iterations — packages/design-system/components/blocks/style-configurator/use-style-config.ts:36-46
**What:** Two separate `for...of` loops iterate over `BASE_COLORS` entries and `ACCENT_COLORS` entries, each calling `Object.entries()`. These could be combined or simplified.
**Fix:** Use `Object.assign` for a single-pass merge:
```typescript
const vars: Record<string, string> = {
  ...BASE_COLORS[config.baseColor][mode],
  ...ACCENT_COLORS[config.accent][mode],
  "--radius": `${config.radius}rem`,
};
```
**Impact:** Minor — the loops are small. But simpler code is also easier to maintain.

---

### MEDIUM — rendering-conditional-render — apps/web/app/[locale]/(frontier)/home-page-client.tsx:402
**What:** Uses `plan.badge && (...)` pattern for conditional rendering. If `plan.badge` is an empty string, this renders the empty string as text instead of rendering nothing.
**Fix:** Use ternary or explicit boolean coercion:
```typescript
{plan.badge ? (<div>...</div>) : null}
```
**Impact:** Low — `plan.badge` is likely always a non-empty string or undefined, but the ternary pattern is safer and communicates intent more clearly.

---

### MEDIUM — rerender-functional-setstate — packages/design-system/components/ui/sidebar.tsx:76-88
**What:** The `setOpen` callback in `SidebarProvider` closes over `open` state to compute the new value via `typeof value === "function" ? value(open) : value`. This means `setOpen` changes reference every time `open` changes (it's in the dependency array). This cascades to `toggleSidebar` and `contextValue` changing on every toggle.
**Fix:** Use `_setOpen` (the raw setter) with a functional updater pattern to avoid closing over `open`:
```typescript
const setOpen = React.useCallback(
  (value: boolean | ((prev: boolean) => boolean)) => {
    const openState = typeof value === "function" ? value(openProp ?? _open) : value;
    // ... cookie logic
  },
  [setOpenProp, _open, openProp] // still needs the current value for cookie
);
```
Note: This is a shadcn/ui standard component, so the fix may be deferred to an upstream update.
**Impact:** Medium — every sidebar toggle causes context value to change, re-rendering all sidebar consumers. In practice, this is acceptable since toggle is infrequent.

---

### MEDIUM — server-hoist-static-io — apps/web/app/[locale]/(frontier)/home-page-client.tsx:96-203
**What:** The `techStack` array contains inline SVG JSX in the `icon` field. These SVG elements are re-created on every render of the module. While hoisted to module scope, each render still allocates new React elements because JSX in a module-level array is evaluated once at module load — which is actually fine. However, this is a 100+ line data declaration inside a client component that ships to the browser unnecessarily.
**Fix:** Move the static data arrays (`features`, `techStack`, `planCtas`) to a separate shared constants file or to the server component, passing only the data needed. The SVG icons could be extracted into tiny static components.
**Impact:** Low-to-medium. The data is already module-scoped so no re-render cost, but it inflates the client bundle.

---

### MEDIUM — bundle-defer-third-party — packages/design-system/components/blocks/style-configurator/style-configurator.tsx:49-64
**What:** Google Fonts are loaded dynamically via `document.createElement("link")` inside a `useEffect`. While this is lazy (good), the font link is never cleaned up when the component unmounts or when the font changes. Additionally, font links accumulate in the DOM.
**Fix:** Add cleanup logic to remove the link element when the font changes or the component unmounts. Also consider using `next/font` for better font optimization, or `React DOM resource hints` (`preload`) for the font URLs.
**Impact:** Memory leak (accumulated link elements) and potential FOUT (flash of unstyled text) without proper font preloading.

---

### LOW — rendering-content-visibility — apps/web/app/[locale]/(frontier)/home-page-client.tsx:350-392
**What:** The features grid (9 items) and tech stack grid (8 items) are rendered eagerly below the fold. These sections are not visible on initial load for most viewport sizes.
**Fix:** Add `content-visibility: auto` and `contain-intrinsic-size` CSS to the sections below the fold:
```css
.below-fold-section {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px;
}
```
**Impact:** Low — these sections are relatively lightweight. But for users on slow connections, deferring paint of off-screen content improves initial render time.

---

### LOW — rerender-lazy-state-init — packages/design-system/components/ui/sidebar.tsx:612
**What:** `SidebarMenuSkeleton` uses lazy state initialization correctly: `useState(() => ...)`. This is already following best practices. No issue here — noting for completeness.
**Fix:** None needed.
**Impact:** None — this is correct.

---

### LOW — js-batch-dom-css — apps/web/app/[locale]/(frontier)/home-page-client.tsx:255-260
**What:** The `useEffect` that applies CSS variables iterates over `cssVars` entries and calls `el.style.setProperty` for each one. This triggers multiple style recalculations.
**Fix:** Use `el.style.cssText` or `Object.assign(el.style, ...)` to batch all property changes, or better yet, apply vars via `el.setAttribute("style", ...)` in a single call. Alternatively, since `React style prop doesn't handle custom properties reliably` (per the comment), verify if this is still true in React 19 — if fixed, use the React style prop directly and remove the imperative DOM manipulation entirely.
**Impact:** Low — CSS variable updates are infrequent (only on config change). Batching would eliminate intermediate reflows.

---

### LOW — advanced-init-once — packages/design-system/components/blocks/style-configurator/style-configurator.tsx:55-58
**What:** The Google Font link injection checks `document.getElementById(id)` to avoid duplicates, which is correct. However, each font change creates a new link element without removing old ones.
**Fix:** Store previously injected font IDs and remove stale ones when the font changes. Or use a module-level `Set` to track which fonts have been loaded.
**Impact:** Low — users rarely switch fonts more than a few times. But accumulated link elements are technically a resource leak.

---

## Additional Observations (No Action Required)

### Good Patterns Found
1. **Promise.all for parallel fetching**: Members page, billing page, invitations page, and invite-links page all correctly use `Promise.all` to parallelize independent operations.
2. **Suspense with deferred promises**: Members page, invitations page, and invite-links page all correctly pass unresolved promises to client components wrapped in Suspense boundaries — the recommended streaming pattern.
3. **React.cache usage**: `validateOrgMembershipBySlug` and `getServerSession` appear to be wrapped in `React.cache` (referenced in CLAUDE.md), which deduplicates calls between layout and page within the same request.
4. **Module-scoped static data**: `features`, `techStack`, and `planCtas` in home-page-client.tsx are hoisted to module scope, avoiding re-creation on each render.
5. **Functional setState**: Sidebar toggle uses `setOpenMobile((open) => !open)` — correct pattern.
6. **useMemo for context value**: `SidebarProvider` correctly memoizes its context value.
7. **Lazy state initialization**: `SidebarMenuSkeleton` uses `useState(() => ...)` for the random width.
8. **Direct component imports**: All design system imports use direct paths (e.g., `@repo/design-system/components/ui/button`), not barrel imports — matching project conventions.
