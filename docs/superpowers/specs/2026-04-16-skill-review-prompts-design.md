# Skill-Based Codebase Review Prompts

**Date:** 2026-04-16
**Status:** Approved
**Approach:** A — Skill-Invocation Prompts

## Purpose

Four prompts that invoke Vercel/web skills to perform deep codebase reviews. Each prompt targets one skill's full pattern set with specific file paths and context from this project.

## Usage

Run each prompt in a separate Claude Code session. Each invokes a skill and provides codebase-specific context so the review is targeted, not generic.

---

## Prompt 1: React Best Practices

**Skill:** `vercel:react-best-practices`
**Scope:** 69 rules across 8 categories — waterfalls, bundle size, server performance, client data fetching, re-render optimization, rendering, JS performance, advanced patterns.

```
/vercel:react-best-practices

Review the following files for all React and Next.js performance patterns — waterfalls, bundle size, server-side performance, client-side data fetching, re-render optimization, rendering performance, JS performance, and advanced patterns.

Priority files (largest/most complex):
- apps/web/app/[locale]/(frontier)/home-page-client.tsx (505 lines, Client Component)
- packages/design-system/components/ui/sidebar.tsx (728 lines, compound component)
- packages/design-system/components/blocks/style-configurator/use-style-config.ts (hook with useEffect DOM manipulation)
- packages/design-system/components/blocks/style-configurator/StyleConfigurator.tsx (244 lines)
- apps/web/app/[locale]/(app)/[orgSlug]/members/page.tsx (data fetching with Promise.all + Suspense)
- apps/web/app/[locale]/(app)/[orgSlug]/layout.tsx (org layout with sidebar)
- packages/design-system/components/ui/grid.tsx (212 lines)
- apps/web/app/[locale]/(frontier)/page.tsx (Server Component entry)

Also scan:
- All page.tsx and layout.tsx under apps/web/app/[locale]/
- All "use client" components in packages/design-system/components/
- All hooks in packages/design-system/hooks/

Report every finding as: file:line — rule-id — severity — what to fix.
```

---

## Prompt 2: Composition Patterns

**Skill:** `vercel:composition-patterns`
**Scope:** 9 rules across 4 categories — component architecture, state management, implementation patterns, React 19 APIs.

```
/vercel:composition-patterns

Review all component APIs for composition quality — boolean prop proliferation, compound component structure, state decoupling, context interfaces, explicit variants, children vs render props, and React 19 API usage (forwardRef removal, use() vs useContext).

Priority files:
- packages/design-system/components/ui/sidebar.tsx (728 lines, largest compound component)
- packages/design-system/components/ui/form.tsx (compound form with context)
- packages/design-system/components/ui/card.tsx (slot-based card)
- packages/design-system/components/ui/button.tsx (CVA variants + asChild polymorphism)
- packages/design-system/components/ui/grid.tsx (GridSection, GridBlock, GridSeparator)
- packages/design-system/components/blocks/hero/ (props-heavy component)
- packages/design-system/components/blocks/style-configurator/StyleConfigurator.tsx
- packages/design-system/components/molecules/header/
- packages/design-system/components/molecules/footer/
- apps/web/app/[locale]/(frontier)/home-page-client.tsx (consumer of many components)

Check specifically:
- Any component with 3+ boolean props
- forwardRef usage that can be replaced (React 19)
- useContext that can be replaced with use()
- Props interfaces that mix concerns
- Components that should be compound but aren't

Report every finding as: file:line — rule-id — severity — what to fix.
```

---

## Prompt 3: View Transitions

**Skill:** `vercel:react-view-transitions`
**Scope:** 55+ patterns — implementation audit (no view transitions exist yet).

```
/vercel:react-view-transitions

This codebase has ZERO view transitions currently. Audit the app and produce an implementation plan following the skill's 7-step workflow.

Step 1 — Audit these navigation paths:
- apps/web/app/[locale]/(frontier)/page.tsx -> auth/sign-in (public -> auth)
- apps/web/app/[locale]/(app)/[orgSlug]/layout.tsx -> members, billing, settings (lateral tab navigation)
- apps/web/app/[locale]/(app)/account/layout.tsx -> profile, security, danger (lateral tab navigation)
- Org switcher navigation (org -> different org)
- apps/web/app/[locale]/(app)/[orgSlug]/members/page.tsx (Suspense boundaries with skeleton fallbacks)

Step 2 — Identify:
- Every <Link> and router.push in apps/web/
- Every <Suspense> boundary and its fallback
- Persistent elements: Header, OrgSidebar, AccountSidebar, SiteHeader
- Shared visual elements between routes (org logos, user avatars)
- Skeleton-to-content transitions in data tables

Step 3-7 — For each finding, recommend:
- Which VT pattern to use (shared element, suspense reveal, list identity, state change, route change)
- Exact CSS recipe to add
- Where to place <ViewTransition> components
- Which elements need viewTransitionName for persistence
- Where default="none" is needed

Output: A prioritized implementation plan with specific file:line locations and code snippets.
```

---

## Prompt 4: Web Design Guidelines

**Skill:** `web-design-guidelines`
**Scope:** Dynamic compliance audit against Vercel Labs Web Interface Guidelines + project DESIGN.md.

```
/web-design-guidelines

Review the following UI files against the full Web Interface Guidelines from Vercel Labs.

Files to review:
- apps/web/app/[locale]/(frontier)/home-page-client.tsx (homepage — largest UI surface)
- packages/design-system/components/ui/grid.tsx
- packages/design-system/components/ui/button.tsx
- packages/design-system/components/ui/card.tsx
- packages/design-system/components/ui/form.tsx
- packages/design-system/components/ui/sidebar.tsx
- packages/design-system/components/blocks/hero/
- packages/design-system/components/blocks/pricing/
- packages/design-system/components/blocks/style-configurator/StyleConfigurator.tsx
- packages/design-system/components/molecules/header/
- packages/design-system/components/molecules/footer/
- apps/web/app/[locale]/auth/sign-in/sign-in-client.tsx
- apps/web/app/[locale]/auth/sign-up/sign-up-client.tsx
- packages/design-system/styles/globals.css

Also reference DESIGN.md at the project root for the project's own design spec (brutally minimal, 0 border radius, 1px borders, Geist font, OKLch colors).

Flag any violations of both the Web Interface Guidelines AND DESIGN.md. Report as: file:line — guideline — what to fix.
```

---

## Execution Order

Run in this order for best results:

1. **Composition Patterns** first — fixes here may change component APIs that other reviews reference
2. **React Best Practices** second — performance fixes on stable component architecture
3. **Web Design Guidelines** third — UI compliance on performance-optimized code
4. **View Transitions** last — implementation audit builds on the reviewed, stable codebase

## Codebase Context

- **Framework:** Next.js 16 (App Router, async params, Server Components)
- **Design System:** 57+ shadcn/ui components, CVA variants, Radix UI primitives
- **Recent work:** Homepage redesign with grid system + interactive style configurator
- **View Transitions:** None implemented yet
- **Design spec:** DESIGN.md — brutally minimal, 0 border radius, 1px borders, Geist font, OKLch colors
- **Key large files:** home-page-client.tsx (505 lines), sidebar.tsx (728 lines), color-presets.ts (347 lines)
