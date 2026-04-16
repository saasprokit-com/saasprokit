# View Transitions Audit -- 2026-04-16

## Summary

- Navigation paths audited: **18**
- VT patterns recommended: Persistent element isolation, Suspense reveal, Lateral tab fade, Route-change fade, State-change enter/exit
- Files to modify: **22**
- Estimated implementation effort: Medium (2-3 sessions)

### Navigation Map

| Route | Navigates to | Direction | VT pattern |
|-------|-------------|-----------|------------|
| `/` (frontier home) | `/auth/sign-in`, `/auth/sign-up`, `/docs` | forward | fade (cross-layout, no VT pair forms) |
| `/auth/sign-in` | `/org` (post-login redirect) | forward | no VT (full page redirect) |
| `/org` | `/:orgSlug` (server redirect) | forward | no VT (server redirect) |
| `/:orgSlug` (dashboard) | `/:orgSlug/members` | lateral | fade or `default="none"` |
| `/:orgSlug` (dashboard) | `/:orgSlug/settings` | lateral | fade or `default="none"` |
| `/:orgSlug` (dashboard) | `/:orgSlug/billing` | lateral | fade or `default="none"` |
| `/:orgSlug/members` | `/:orgSlug/members/invitations` | lateral (tab) | `default="none"` (tab content swap) |
| `/:orgSlug/members` | `/:orgSlug/members/invite-links` | lateral (tab) | `default="none"` (tab content swap) |
| `/:orgSlug/members/invitations` | `/:orgSlug/members/invite-links` | lateral (tab) | `default="none"` (tab content swap) |
| `/:orgSlug/billing` | `/:orgSlug/checkout/success` | forward | fade-in |
| `/:orgSlug/checkout/success` | `/:orgSlug` (dashboard) | back | fade-in |
| OrgSwitcher | `/:otherOrgSlug` | lateral | fade (same layout, different data) |
| Sidebar nav | `/account/profile` | lateral | fade or `default="none"` |
| `/account/profile` | `/account/security` | lateral | fade or `default="none"` |
| `/account/security` | `/account/danger` | lateral | fade or `default="none"` |
| `/account` sidebar "Organization" link | `/org` | back | fade |
| Members page Suspense | content loads | -- | slide-up reveal |
| Invitations page Suspense | content loads | -- | slide-up reveal |
| Invite links page Suspense | content loads | -- | slide-up reveal |
| `loading.tsx` boundaries (settings, billing, security) | content loads | -- | slide-up reveal |
| Verify email Suspense | content loads | -- | fade reveal |
| Magic link Suspense | content loads | -- | fade reveal |

---

## Config Changes Required

### `apps/web/next.config.ts`

Enable the experimental view transition flag. This wraps every `<Link>` navigation in `document.startViewTransition` automatically.

```typescript
// apps/web/next.config.ts — line 32, inside the `experimental` block
experimental: {
  viewTransition: true,  // ADD THIS
  serverActions: {
    allowedOrigins: [
      new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
        .host,
    ],
  },
},
```

**File:** `apps/web/next.config.ts:32`
**Change:** Add `viewTransition: true` to the existing `experimental` object.

---

## CSS Recipes to Add

Add the following to the end of `packages/design-system/styles/globals.css` (before the closing of the file).

```css
/* ═══════════════════════════════════════════════════════════════════════════
   View Transition Recipes
   ═══════════════════════════════════════════════════════════════════════════ */

/* Timing Variables */
:root {
  --vt-duration-exit: 150ms;
  --vt-duration-enter: 210ms;
  --vt-duration-move: 400ms;
}

/* Shared Keyframes */
@keyframes vt-fade {
  from { filter: blur(3px); opacity: 0; }
  to { filter: blur(0); opacity: 1; }
}

@keyframes vt-slide {
  from { translate: var(--slide-offset); }
  to { translate: 0; }
}

@keyframes vt-slide-y {
  from { transform: translateY(var(--slide-y-offset, 10px)); }
  to { transform: translateY(0); }
}

/* ── Fade ── */
::view-transition-old(.fade-out) {
  animation: var(--vt-duration-exit) ease-in vt-fade reverse;
}
::view-transition-new(.fade-in) {
  animation: var(--vt-duration-enter) ease-out var(--vt-duration-exit) both vt-fade;
}

/* ── Slide (Vertical) — for Suspense reveals ── */
::view-transition-old(.slide-down) {
  animation:
    var(--vt-duration-exit) ease-out both vt-fade reverse,
    var(--vt-duration-exit) ease-out both vt-slide-y reverse;
}
::view-transition-new(.slide-up) {
  animation:
    var(--vt-duration-enter) ease-in var(--vt-duration-exit) both vt-fade,
    var(--vt-duration-move) ease-in both vt-slide-y;
}

/* ── Directional Navigation (forward/back) ── */
::view-transition-old(.nav-forward) {
  --slide-offset: -60px;
  animation:
    var(--vt-duration-exit) ease-in both vt-fade reverse,
    var(--vt-duration-move) ease-in-out both vt-slide reverse;
}
::view-transition-new(.nav-forward) {
  --slide-offset: 60px;
  animation:
    var(--vt-duration-enter) ease-out var(--vt-duration-exit) both vt-fade,
    var(--vt-duration-move) ease-in-out both vt-slide;
}

::view-transition-old(.nav-back) {
  --slide-offset: 60px;
  animation:
    var(--vt-duration-exit) ease-in both vt-fade reverse,
    var(--vt-duration-move) ease-in-out both vt-slide reverse;
}
::view-transition-new(.nav-back) {
  --slide-offset: -60px;
  animation:
    var(--vt-duration-enter) ease-out var(--vt-duration-exit) both vt-fade,
    var(--vt-duration-move) ease-in-out both vt-slide;
}

/* ── Shared Element Morph ── */
::view-transition-group(.morph) {
  animation-duration: var(--vt-duration-move);
}
::view-transition-image-pair(.morph) {
  animation-name: vt-via-blur;
}
@keyframes vt-via-blur {
  30% { filter: blur(3px); }
}

/* ── Text Morph (avoids raster scaling on text) ── */
::view-transition-group(.text-morph) {
  animation-duration: var(--vt-duration-move);
}
::view-transition-old(.text-morph) {
  display: none;
}
::view-transition-new(.text-morph) {
  animation: none;
  object-fit: none;
  object-position: left top;
}

/* ── Persistent Element Isolation ── */
::view-transition-group(site-header) {
  animation: none;
  z-index: 100;
}

::view-transition-group(org-sidebar) {
  animation: none;
  z-index: 100;
}

::view-transition-group(account-sidebar) {
  animation: none;
  z-index: 100;
}

::view-transition-group(frontier-header) {
  animation: none;
  z-index: 100;
}

/* ── Reduced Motion (Accessibility) ── */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(*),
  ::view-transition-new(*),
  ::view-transition-group(*) {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
  }
}
```

**File:** `packages/design-system/styles/globals.css`
**Change:** Append the entire CSS block above after line 223 (end of file).

---

## Implementation Priority

### P1 -- Persistent Elements (isolate headers/sidebars from transition snapshots)

These elements persist across route navigations within their layout. Without `viewTransitionName` isolation, they get captured in the page content snapshot and visually slide/fade with the page content. Isolating them makes them stay perfectly still during transitions.

#### P1.1 -- SiteHeader (app layout breadcrumb header)

**File:** `packages/design-system/components/layout/site-header.tsx:24`
**What:** Add `viewTransitionName` to the `<header>` element.

```tsx
// BEFORE
<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">

// AFTER
<header
  className="flex h-16 shrink-0 items-center gap-2 border-b px-4"
  style={{ viewTransitionName: "site-header" }}
>
```

**Why:** The SiteHeader renders in both `OrgLayout` and `AccountLayout`. During lateral navigation (dashboard -> members -> settings), it persists. Without isolation, it gets captured in the old page snapshot and appears to slide away, then reappear.

#### P1.2 -- OrgSidebar

**File:** `apps/web/app/[locale]/(app)/[orgSlug]/components/org-sidebar.tsx:107`
**What:** Add `viewTransitionName` to the `<Sidebar>` root.

```tsx
// BEFORE
<Sidebar collapsible="icon" variant="sidebar">

// AFTER
<Sidebar collapsible="icon" variant="sidebar" style={{ viewTransitionName: "org-sidebar" }}>
```

**Why:** The sidebar persists across all org-scoped page navigations (dashboard, members, settings, billing). It must be isolated from the page content transition.

#### P1.3 -- AccountSidebar

**File:** `apps/web/app/[locale]/(app)/account/components/account-sidebar.tsx:78`
**What:** Add `viewTransitionName` to the `<Sidebar>` root.

```tsx
// BEFORE
<Sidebar collapsible="icon" variant="sidebar">

// AFTER
<Sidebar collapsible="icon" variant="sidebar" style={{ viewTransitionName: "account-sidebar" }}>
```

**Why:** Same as OrgSidebar -- persists across account sub-pages (profile, security, danger).

#### P1.4 -- Frontier Header (public pages)

**File:** `packages/design-system/components/molecules/header/header.tsx:23`
**What:** Add `viewTransitionName` to the `<header>` element.

```tsx
// BEFORE
<header className={cn("border-border border-b", className)}>

// AFTER
<header
  className={cn("border-border border-b", className)}
  style={{ viewTransitionName: "frontier-header" }}
>
```

**Why:** The frontier header persists across public pages. If more public pages are added (pricing, about), it should remain static during transitions.

#### P1.5 -- Main content wrapper

**File:** `packages/design-system/components/layout/main.tsx:7`
**What:** Add `viewTransitionName` to scope content animations correctly.

```tsx
// BEFORE
<main className="flex flex-1 flex-col gap-4 p-4">{children}</main>

// AFTER
<main
  className="flex flex-1 flex-col gap-4 p-4"
  style={{ viewTransitionName: "main-content" }}
>
  {children}
</main>
```

**Why:** Giving the main content area its own transition name ensures it animates independently from the sidebar and header. Page content transitions happen only within this region.

**Note:** This may need to be *removed* if you implement page-level `<ViewTransition>` wrappers in P2, because having a `viewTransitionName` on the parent and a `<ViewTransition>` on the child can interfere. Test with and without this isolation. If page-level VTs work correctly without it, skip P1.5.

---

### P2 -- Route Transitions (page-level fade for lateral navigation)

All navigation within the org layout (dashboard <-> members <-> settings <-> billing) and within the account layout (profile <-> security <-> danger) is **lateral** -- no hierarchical depth. The correct animation is a subtle cross-fade, not a directional slide.

#### P2.1 -- Org Dashboard page

**File:** `apps/web/app/[locale]/(app)/[orgSlug]/page.tsx`
**What:** Wrap the page return value in `<ViewTransition>`.

```tsx
import { ViewTransition } from "react";

// Wrap the return at line 28
return (
  <ViewTransition enter="fade-in" exit="fade-out" default="none">
    <>
      <SetBreadcrumbs items={[{ label: organization?.name ?? "Dashboard" }]} />
      <ContentSection
        description="Organization Dashboard"
        title={organization?.name ?? "Dashboard"}
      >
        {/* ... existing content ... */}
      </ContentSection>
    </>
  </ViewTransition>
);
```

**Why:** When navigating from dashboard to members (or any other org page), this page unmounts. The `exit="fade-out"` creates a smooth departure. `default="none"` prevents re-animation on Suspense resolves or revalidations.

#### P2.2 -- Org Settings page

**File:** `apps/web/app/[locale]/(app)/[orgSlug]/settings/page.tsx`
**What:** Same pattern as P2.1.

```tsx
import { ViewTransition } from "react";

return (
  <ViewTransition enter="fade-in" exit="fade-out" default="none">
    <>
      <SetBreadcrumbs ... />
      <ContentSection ...>
        <OrgSettingsForm ... />
      </ContentSection>
    </>
  </ViewTransition>
);
```

#### P2.3 -- Org Billing page

**File:** `apps/web/app/[locale]/(app)/[orgSlug]/billing/page.tsx`
**What:** Same pattern as P2.1.

```tsx
import { ViewTransition } from "react";

return (
  <ViewTransition enter="fade-in" exit="fade-out" default="none">
    <>
      <SetBreadcrumbs ... />
      <ContentSection ...>
        {/* ... billing content ... */}
      </ContentSection>
    </>
  </ViewTransition>
);
```

#### P2.4 -- Account Profile page

**File:** `apps/web/app/[locale]/(app)/account/profile/page.tsx`
**What:** Same pattern.

```tsx
import { ViewTransition } from "react";

return (
  <ViewTransition enter="fade-in" exit="fade-out" default="none">
    <>
      <SetBreadcrumbs ... />
      <ContentSection ...>
        <ProfileForm ... />
      </ContentSection>
    </>
  </ViewTransition>
);
```

#### P2.5 -- Account Security page

**File:** `apps/web/app/[locale]/(app)/account/security/page.tsx`
**What:** Same pattern.

#### P2.6 -- Account Danger page

**File:** `apps/web/app/[locale]/(app)/account/danger/page.tsx`
**What:** Same pattern.

#### P2.7 -- Account New Org page

**File:** `apps/web/app/[locale]/(app)/account/new-org/page.tsx`
**What:** Same pattern.

#### P2.8 -- Checkout Success page

**File:** `apps/web/app/[locale]/(app)/[orgSlug]/checkout/success/page.tsx`
**What:** Same pattern -- fade in on arrival.

#### P2.9 -- Checkout Canceled page

**File:** `apps/web/app/[locale]/(app)/[orgSlug]/checkout/canceled/page.tsx`
**What:** Same pattern.

#### P2.10 -- Members layout (wraps members/invitations/invite-links)

**File:** `apps/web/app/[locale]/(app)/[orgSlug]/members/layout.tsx`

**Important:** Do NOT add a `<ViewTransition>` wrapping `{children}` in this layout. Layouts persist across navigations and never trigger enter/exit. The MembersNav tabs are lateral navigation -- the children (members list, invitations, invite-links) swap out via enter/exit on their own page components.

The layout itself stays mounted. Only the child pages need VTs.

---

### P3 -- Suspense Reveals (skeleton-to-content animations)

#### P3.1 -- Members table (explicit Suspense)

**File:** `apps/web/app/[locale]/(app)/[orgSlug]/members/page.tsx:38-47`

```tsx
import { ViewTransition } from "react";

// BEFORE
<Suspense fallback={<MembersTableSkeleton />}>
  <MembersTable ... />
</Suspense>

// AFTER
<Suspense
  fallback={
    <ViewTransition exit="slide-down">
      <MembersTableSkeleton />
    </ViewTransition>
  }
>
  <ViewTransition enter="slide-up" default="none">
    <MembersTable ... />
  </ViewTransition>
</Suspense>
```

**Why:** The skeleton slides down and fades out, while the real table slides up and fades in. `default="none"` on the content VT prevents re-animation when the page is re-rendered for other reasons.

#### P3.2 -- Invitations table (explicit Suspense)

**File:** `apps/web/app/[locale]/(app)/[orgSlug]/members/invitations/page.tsx:38-47`
**What:** Same pattern as P3.1 with `InvitationsTableSkeleton` / `InvitationsTable`.

```tsx
<Suspense
  fallback={
    <ViewTransition exit="slide-down">
      <InvitationsTableSkeleton />
    </ViewTransition>
  }
>
  <ViewTransition enter="slide-up" default="none">
    <InvitationsTable ... />
  </ViewTransition>
</Suspense>
```

#### P3.3 -- Invite links table (explicit Suspense)

**File:** `apps/web/app/[locale]/(app)/[orgSlug]/members/invite-links/page.tsx:38-49`
**What:** Same pattern as P3.1 with `InviteLinksTableSkeleton` / `InviteLinksTable`.

```tsx
<Suspense
  fallback={
    <ViewTransition exit="slide-down">
      <InviteLinksTableSkeleton />
    </ViewTransition>
  }
>
  <ViewTransition enter="slide-up" default="none">
    <InviteLinksTable ... />
  </ViewTransition>
</Suspense>
```

#### P3.4 -- Settings loading.tsx (implicit Suspense boundary)

**File:** `apps/web/app/[locale]/(app)/[orgSlug]/settings/loading.tsx`

```tsx
import { ViewTransition } from "react";
import { SuspenseFallback } from "@repo/design-system/components/ui/suspense-fallback";

export default function Loading() {
  return (
    <ViewTransition exit="slide-down">
      <SuspenseFallback />
    </ViewTransition>
  );
}
```

The corresponding page component (`settings/page.tsx`) already gets wrapped in P2.2 with `enter="fade-in"`. Since the `loading.tsx` is an implicit Suspense boundary, the exit on the skeleton and the enter on the page form the reveal pair.

**Note:** Since `loading.tsx` acts as an implicit `<Suspense>` boundary, and the page component has `<ViewTransition enter="fade-in" ...>`, these form the exit/enter pair. Using `slide-down` for the skeleton exit and `fade-in` for the page enter creates a clean vertical-dismiss + content-appear effect.

#### P3.5 -- Billing loading.tsx

**File:** `apps/web/app/[locale]/(app)/[orgSlug]/billing/loading.tsx`
**What:** Same pattern as P3.4.

```tsx
import { ViewTransition } from "react";
import { SuspenseFallback } from "@repo/design-system/components/ui/suspense-fallback";

export default function Loading() {
  return (
    <ViewTransition exit="slide-down">
      <SuspenseFallback />
    </ViewTransition>
  );
}
```

#### P3.6 -- Account Security loading.tsx

**File:** `apps/web/app/[locale]/(app)/account/security/loading.tsx`
**What:** Same pattern as P3.4.

```tsx
import { ViewTransition } from "react";
import { SuspenseFallback } from "@repo/design-system/components/ui/suspense-fallback";

export default function Loading() {
  return (
    <ViewTransition exit="slide-down">
      <SuspenseFallback />
    </ViewTransition>
  );
}
```

#### P3.7 -- Root loading.tsx

**File:** `apps/web/app/loading.tsx`
**What:** Same pattern -- this is the app-wide initial loading state.

```tsx
import { ViewTransition } from "react";
import { SuspenseFallback } from "@repo/design-system/components/ui/suspense-fallback";

export default function Loading() {
  return (
    <ViewTransition exit="fade-out">
      <SuspenseFallback className="min-h-screen" />
    </ViewTransition>
  );
}
```

For the root loading, use `fade-out` rather than `slide-down` since there is no spatial relationship to communicate.

#### P3.8 -- Verify email page Suspense

**File:** `apps/web/app/[locale]/auth/verify-email/page.tsx:16-18`

```tsx
import { ViewTransition } from "react";

// BEFORE
<Suspense fallback={<SuspenseFallback className="min-h-screen" />}>
  <VerifyEmailClient errors={dict.errors.action} />
</Suspense>

// AFTER
<Suspense
  fallback={
    <ViewTransition exit="fade-out">
      <SuspenseFallback className="min-h-screen" />
    </ViewTransition>
  }
>
  <ViewTransition enter="fade-in" default="none">
    <VerifyEmailClient errors={dict.errors.action} />
  </ViewTransition>
</Suspense>
```

#### P3.9 -- Magic link page Suspense

**File:** `apps/web/app/[locale]/auth/magic-link/page.tsx:91`

```tsx
// BEFORE
<Suspense fallback={<SuspenseFallback />}>
  <MagicLinkContent />
</Suspense>

// AFTER
<Suspense
  fallback={
    <ViewTransition exit="fade-out">
      <SuspenseFallback />
    </ViewTransition>
  }
>
  <ViewTransition enter="fade-in" default="none">
    <MagicLinkContent />
  </ViewTransition>
</Suspense>
```

---

### P4 -- Shared Elements (morphing between views)

This app has **limited shared element candidates** because most navigation is lateral (tab-to-tab within the same layout). Shared element morphs are most powerful for hierarchical navigation (list -> detail), which this app does not currently have in its data tables.

#### P4.1 -- Org icon in OrgSwitcher (potential, low priority)

**File:** `packages/design-system/components/layout/org-switcher.tsx:125`

When switching organizations, the org icon in the sidebar header could morph to the new org's icon. However, since org switching triggers a full `router.push()` that changes the org slug and causes a layout re-render with new data, a shared element morph would require both the old and new VTs to exist simultaneously, which they don't in a server-component layout remount.

**Recommendation:** Skip for now. The org switcher navigation triggers a server-side data reload. A subtle fade on the entire sidebar content area is more appropriate than a shared element morph.

#### P4.2 -- User avatar across OrgSidebar and AccountSidebar (potential, low priority)

The user avatar appears in both `NavUser` (org sidebar footer) and `AccountSidebar` header. When navigating from an org page to account pages, the avatar could theoretically morph. However, these are in different layouts (`OrgLayout` vs `AccountLayout`), so both unmount/remount entirely -- the user avatar is not a shared element in the VT sense (one unmounts before the other mounts in the same transition).

**Recommendation:** Skip. Cross-layout navigations involve full layout remounts. No pair can form.

#### P4.3 -- Future: Member list -> Member detail

If/when a member detail page is added (clicking a member row to see their profile), that would be the ideal shared element candidate:

```tsx
// In the members table row
<ViewTransition name={`member-avatar-${member.id}`} share="morph" default="none">
  <Avatar ...>
    <AvatarImage src={member.image} />
  </Avatar>
</ViewTransition>

// On the hypothetical member detail page
<ViewTransition name={`member-avatar-${member.id}`} share="morph">
  <Avatar ...>
    <AvatarImage src={member.image} />
  </Avatar>
</ViewTransition>
```

**Recommendation:** Document this as the pattern for when detail views are added. Not actionable today.

---

### P5 -- Programmatic Navigation Fixes

#### P5.1 -- OrgSwitcher uses raw `router.push()` without `startTransition`

**File:** `apps/web/app/[locale]/(app)/[orgSlug]/components/org-sidebar.tsx:86-88`

The `handleOrganizationChange` callback uses `router.push()` directly. For view transitions to activate on programmatic navigation, the push must be inside `startTransition`. The component already imports `useTransition` (line 21) and has `startTransition` available (line 45).

```tsx
// BEFORE
const handleOrganizationChange = (org: Organization) => {
  router.push(orgRoutes.home(org.slug));
};

// AFTER
const handleOrganizationChange = (org: Organization) => {
  startTransition(() => {
    router.push(orgRoutes.home(org.slug));
  });
};
```

**Also apply to:**
- `handleCreateOrganization` (line 90-92):
  ```tsx
  const handleCreateOrganization = () => {
    startTransition(() => {
      router.push(`/${locale}${PAGE_ROUTES.ACCOUNT_NEW_ORG}`);
    });
  };
  ```

- `handleSignOut` (line 101-104):
  ```tsx
  const handleSignOut = async () => {
    await signOut();
    startTransition(() => {
      router.push("/");
    });
  };
  ```

#### P5.2 -- Sign-in client uses `router.push()` without `startTransition`

**File:** `apps/web/app/[locale]/auth/sign-in/sign-in-client.tsx:52-53`

```tsx
// BEFORE
router.push(PAGE_ROUTES.ORG);
router.refresh();

// AFTER (inside the existing async function)
startTransition(() => {
  router.push(PAGE_ROUTES.ORG);
  router.refresh();
});
```

Note: The `startTransition` from `useTransition` is already available at line 36 (`[isLoading, startTransition]`). The push after sign-in triggers a cross-layout navigation (auth -> app), so VT activation here provides a smooth transition rather than a hard cut.

#### P5.3 -- `router.back()` usage (informational, no change needed)

**Files:**
- `apps/web/app/not-found.tsx:20`
- `apps/web/app/[locale]/not-found.tsx:20`
- `apps/web/app/[locale]/error.tsx:35`

`router.back()` does not trigger view transitions (it uses synchronous `popstate`). These are on error/not-found pages where animation is not expected. No change needed, but be aware of this limitation if back-navigation animations are desired elsewhere in the future.

---

### P6 -- Reusable Component (optional, recommended)

Create a reusable `PageTransition` wrapper to reduce boilerplate across all page files.

**New file:** `apps/web/components/page-transition.tsx`

```tsx
import { ViewTransition } from "react";
import type { ReactNode } from "react";

type PageTransitionProps = {
  children: ReactNode;
};

/**
 * Wraps page content with a fade enter/exit transition.
 * Use in page.tsx files (not layouts).
 * Uses default="none" to prevent re-animation on Suspense/revalidation.
 */
export function PageTransition({ children }: PageTransitionProps) {
  return (
    <ViewTransition enter="fade-in" exit="fade-out" default="none">
      {children}
    </ViewTransition>
  );
}
```

Then each page file simplifies to:

```tsx
import { PageTransition } from "@/components/page-transition";

return (
  <PageTransition>
    {/* page content */}
  </PageTransition>
);
```

---

## Files to Modify (Complete List)

| # | File | Change type |
|---|------|------------|
| 1 | `apps/web/next.config.ts` | Add `viewTransition: true` to experimental |
| 2 | `packages/design-system/styles/globals.css` | Append VT CSS recipes |
| 3 | `packages/design-system/components/layout/site-header.tsx` | Add `viewTransitionName` |
| 4 | `packages/design-system/components/molecules/header/header.tsx` | Add `viewTransitionName` |
| 5 | `apps/web/app/[locale]/(app)/[orgSlug]/components/org-sidebar.tsx` | Add `viewTransitionName` + wrap `router.push` in `startTransition` |
| 6 | `apps/web/app/[locale]/(app)/account/components/account-sidebar.tsx` | Add `viewTransitionName` |
| 7 | `apps/web/app/[locale]/(app)/[orgSlug]/page.tsx` | Wrap in `<ViewTransition>` |
| 8 | `apps/web/app/[locale]/(app)/[orgSlug]/settings/page.tsx` | Wrap in `<ViewTransition>` |
| 9 | `apps/web/app/[locale]/(app)/[orgSlug]/billing/page.tsx` | Wrap in `<ViewTransition>` |
| 10 | `apps/web/app/[locale]/(app)/account/profile/page.tsx` | Wrap in `<ViewTransition>` |
| 11 | `apps/web/app/[locale]/(app)/account/security/page.tsx` | Wrap in `<ViewTransition>` |
| 12 | `apps/web/app/[locale]/(app)/account/danger/page.tsx` | Wrap in `<ViewTransition>` |
| 13 | `apps/web/app/[locale]/(app)/[orgSlug]/members/page.tsx` | Add VT to Suspense boundary |
| 14 | `apps/web/app/[locale]/(app)/[orgSlug]/members/invitations/page.tsx` | Add VT to Suspense boundary |
| 15 | `apps/web/app/[locale]/(app)/[orgSlug]/members/invite-links/page.tsx` | Add VT to Suspense boundary |
| 16 | `apps/web/app/[locale]/(app)/[orgSlug]/settings/loading.tsx` | Wrap in `<ViewTransition exit>` |
| 17 | `apps/web/app/[locale]/(app)/[orgSlug]/billing/loading.tsx` | Wrap in `<ViewTransition exit>` |
| 18 | `apps/web/app/[locale]/(app)/account/security/loading.tsx` | Wrap in `<ViewTransition exit>` |
| 19 | `apps/web/app/loading.tsx` | Wrap in `<ViewTransition exit>` |
| 20 | `apps/web/app/[locale]/auth/verify-email/page.tsx` | Add VT to Suspense boundary |
| 21 | `apps/web/app/[locale]/auth/magic-link/page.tsx` | Add VT to Suspense boundary |
| 22 | `apps/web/app/[locale]/auth/sign-in/sign-in-client.tsx` | Wrap `router.push` in `startTransition` |
| 23 | `apps/web/components/page-transition.tsx` | New reusable wrapper (optional) |

---

## Verification Checklist

After implementing each priority tier, verify every navigation path:

- [ ] **P1: Persistent elements stay static.** Navigate between org dashboard -> members -> settings -> billing. The sidebar and header must not animate -- they should remain completely still while only the page content area transitions.
- [ ] **P1: Account sidebar stays static.** Navigate between profile -> security -> danger. Same behavior.
- [ ] **P2: Page content fades on lateral navigation.** Dashboard -> Members should show a subtle fade transition on the main content area. No directional slide.
- [ ] **P2: No double-animation.** With `default="none"` on page VTs, verify that Suspense resolves do not also trigger the page fade. The Suspense reveal should be independent.
- [ ] **P3: Skeleton-to-content reveals.** Open the members page fresh (or hard-refresh). The skeleton should slide down while the real table slides up. Same for invitations and invite-links tabs.
- [ ] **P3: loading.tsx reveals.** Navigate to settings/billing/security with a slow connection (throttle in DevTools). The spinner should exit smoothly, not just disappear.
- [ ] **P5: Programmatic navigation activates VTs.** Use the org switcher to change organizations. The transition should animate, not hard-cut.
- [ ] **Reduced motion.** Enable "Reduce Motion" in OS accessibility settings. All VT animations should be duration 0 -- instant swap, no movement.
- [ ] **Browser compatibility.** Test in Safari 18.2+, Chrome, Firefox 144+. Unsupported browsers should gracefully skip all animations with no errors.
- [ ] **No competing animations.** Background revalidations (e.g., `router.refresh()` after an action) should NOT trigger visible transitions thanks to `default="none"`.
- [ ] **Members tab navigation.** Switching between Members/Invitations/Invite Links tabs: the persistent MembersNav stays still, only the table content below swaps. Verify no VT is on the members layout that could block child page VTs.
- [ ] **Org switcher navigation.** Changing orgs triggers a layout remount (new orgSlug). The entire content area should fade. Sidebar remounts too (new data) -- verify it looks clean, not glitchy.
- [ ] **`router.back()` on error pages.** The "Go Back" button on not-found/error pages uses `router.back()` which skips VTs. Confirm this is acceptable UX (instant navigation on error pages is fine).

---

## Anti-Patterns to Avoid

1. **Do NOT add `<ViewTransition>` in layouts wrapping `{children}`.** Both `OrgLayout` and `AccountLayout` render `{children}` inside `<Main>`. Adding a VT here would suppress enter/exit on all child page VTs. Page-level VTs are the correct approach.

2. **Do NOT use type-keyed directional slides for sidebar navigation.** All sidebar links are lateral (tab-to-tab). Directional slides (nav-forward/nav-back) falsely imply hierarchical depth. Use simple fade.

3. **Do NOT add `<ViewTransition>` without `default="none"`.** The `experimental.viewTransition` flag makes every `<Link>` click trigger `startViewTransition`. A bare `<ViewTransition>` (default is `"auto"`) would fire the browser cross-fade on every navigation, every Suspense resolve, every revalidation. Always set `default="none"` and explicitly list desired triggers.

4. **Do NOT use `router.back()` for navigation where transitions are desired.** It uses synchronous `popstate` and is incompatible with view transitions. Use `router.push()` with an explicit URL.

5. **Do NOT add shared element `name` props to components rendered in both popovers and pages.** The `NavUser` avatar appears in a dropdown popover -- if given a `viewTransitionName`, it would conflict with any same-named VT on the account pages since both would be mounted simultaneously.
