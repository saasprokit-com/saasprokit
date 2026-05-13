# Skill-Based Codebase Review — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run 4 skill-based reviews against the codebase, collect all findings, triage by severity, and implement fixes grouped by file.

**Architecture:** Sequential review phases (one skill per task), followed by a triage phase that deduplicates and prioritizes findings, then a fix phase that batches changes by file to minimize churn. Each review produces a structured findings file in `docs/superpowers/reviews/`.

**Tech Stack:** Claude Code skills (vercel:composition-patterns, vercel:react-best-practices, web-design-guidelines, vercel:react-view-transitions), Git for atomic commits.

---

## File Structure

**Created:**
- `docs/superpowers/reviews/01-composition-patterns.md` — Findings from composition review
- `docs/superpowers/reviews/02-react-best-practices.md` — Findings from performance review
- `docs/superpowers/reviews/03-web-design-guidelines.md` — Findings from design compliance review
- `docs/superpowers/reviews/04-view-transitions.md` — Findings from view transitions audit
- `docs/superpowers/reviews/05-triage-summary.md` — Deduplicated, prioritized master list

**Modified (potential — depends on findings):**
- `apps/web/app/[locale]/(frontier)/home-page-client.tsx` — Largest client component, likely touched by all 4 reviews
- `packages/design-system/components/ui/sidebar.tsx` — Largest compound component
- `packages/design-system/components/ui/grid.tsx` — Grid primitives
- `packages/design-system/components/blocks/style-configurator/*` — Hook + component
- `packages/design-system/styles/globals.css` — View transition CSS recipes
- `next.config.ts` — View transition experimental flag

---

### Task 1: Run Composition Patterns Review

**Files:**
- Create: `docs/superpowers/reviews/01-composition-patterns.md`

**Why first:** Composition fixes may change component APIs (props, context, compound structure). Running this first stabilizes the component surface before performance and design reviews reference it.

- [ ] **Step 1: Create the reviews directory**

```bash
mkdir -p docs/superpowers/reviews
```

- [ ] **Step 2: Run the composition patterns skill**

Run this prompt in the current session:

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

- [ ] **Step 3: Save findings to review file**

Copy the skill's output into `docs/superpowers/reviews/01-composition-patterns.md` with this structure:

```markdown
# Composition Patterns Review — 2026-04-16

## Summary
- Total findings: [N]
- Critical: [N] | High: [N] | Medium: [N] | Low: [N]

## Findings

### [CRITICAL/HIGH/MEDIUM/LOW] — rule-id — file:line
**What:** Description of the issue
**Fix:** What to change
**Impact:** Why this matters

---
(repeat for each finding)
```

- [ ] **Step 4: Commit the review file**

```bash
git add docs/superpowers/reviews/01-composition-patterns.md
git commit -m "docs: composition patterns review findings"
```

---

### Task 2: Run React Best Practices Review

**Files:**
- Create: `docs/superpowers/reviews/02-react-best-practices.md`

**Why second:** Performance optimizations apply to stable component APIs. After composition fixes are identified (Task 1), this review targets the internal implementation of those components.

- [ ] **Step 1: Run the React best practices skill**

Run this prompt:

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

- [ ] **Step 2: Save findings to review file**

Copy findings into `docs/superpowers/reviews/02-react-best-practices.md` using the same structure as Task 1 Step 3.

- [ ] **Step 3: Commit the review file**

```bash
git add docs/superpowers/reviews/02-react-best-practices.md
git commit -m "docs: react best practices review findings"
```

---

### Task 3: Run Web Design Guidelines Review

**Files:**
- Create: `docs/superpowers/reviews/03-web-design-guidelines.md`

**Why third:** Design compliance should be checked after component architecture and performance are stable. No point flagging a spacing issue on a component that will be restructured.

- [ ] **Step 1: Run the web design guidelines skill**

Run this prompt:

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

- [ ] **Step 2: Save findings to review file**

Copy findings into `docs/superpowers/reviews/03-web-design-guidelines.md` using the same structure as Task 1 Step 3.

- [ ] **Step 3: Commit the review file**

```bash
git add docs/superpowers/reviews/03-web-design-guidelines.md
git commit -m "docs: web design guidelines review findings"
```

---

### Task 4: Run View Transitions Audit

**Files:**
- Create: `docs/superpowers/reviews/04-view-transitions.md`

**Why last:** View transitions are additive — they layer on top of existing, reviewed code. This audit produces an implementation plan rather than bug fixes.

- [ ] **Step 1: Run the view transitions skill**

Run this prompt:

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

- [ ] **Step 2: Save findings to review file**

Copy findings into `docs/superpowers/reviews/04-view-transitions.md`. Use a different structure since this is an implementation plan, not a bug list:

```markdown
# View Transitions Audit — 2026-04-16

## Summary
- Navigation paths audited: [N]
- VT patterns recommended: [list]
- Files to modify: [N]

## Implementation Priority

### P1 — Persistent Elements (isolate headers/sidebars)
- file:line — what to add

### P2 — Route Transitions (directional page slides)
- file:line — what to add

### P3 — Suspense Reveals (skeleton-to-content)
- file:line — what to add

### P4 — Shared Elements (morphing between views)
- file:line — what to add

## CSS Recipes to Add
(exact CSS to add to globals.css)

## Config Changes
(next.config.ts experimental flag)
```

- [ ] **Step 3: Commit the review file**

```bash
git add docs/superpowers/reviews/04-view-transitions.md
git commit -m "docs: view transitions audit and implementation plan"
```

---

### Task 5: Triage and Deduplicate Findings

**Files:**
- Create: `docs/superpowers/reviews/05-triage-summary.md`

**Why:** Multiple reviews may flag the same file or overlapping concerns. This task merges findings into a single prioritized list grouped by file, so fixes are batched efficiently.

- [ ] **Step 1: Read all 4 review files**

```bash
cat docs/superpowers/reviews/01-composition-patterns.md
cat docs/superpowers/reviews/02-react-best-practices.md
cat docs/superpowers/reviews/03-web-design-guidelines.md
cat docs/superpowers/reviews/04-view-transitions.md
```

- [ ] **Step 2: Create the triage summary**

Write `docs/superpowers/reviews/05-triage-summary.md` with this structure:

```markdown
# Triage Summary — 2026-04-16

## Stats
- Total unique findings: [N] (after dedup)
- By severity: Critical [N] | High [N] | Medium [N] | Low [N]
- Files affected: [N]

## Findings Grouped by File

### apps/web/app/[locale]/(frontier)/home-page-client.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | CRITICAL | react-best-practices | bundle-barrel-imports | ... |
| 2 | HIGH | composition-patterns | architecture-avoid-boolean-props | ... |
(all findings for this file in one table)

### packages/design-system/components/ui/sidebar.tsx
(same table format)

(repeat for each affected file)

## Duplicates Removed
- [list any findings that appeared in multiple reviews, noting which reviews flagged them]

## View Transitions (Separate Track)
View transitions are additive features, not fixes. See 04-view-transitions.md for the full implementation plan. Summary of scope:
- [N] files to modify
- [N] CSS recipes to add
- Config: next.config.ts experimental flag needed
```

- [ ] **Step 3: Commit the triage summary**

```bash
git add docs/superpowers/reviews/05-triage-summary.md
git commit -m "docs: triage summary with deduplicated findings by file"
```

---

### Task 6: Implement Critical and High Severity Fixes

**Files:**
- Modify: Files listed in `05-triage-summary.md` under CRITICAL and HIGH severity

**Why:** Fix the most impactful issues first. Group by file to avoid touching the same file multiple times across different fix commits.

- [ ] **Step 1: Read the triage summary to identify CRITICAL/HIGH items**

```bash
cat docs/superpowers/reviews/05-triage-summary.md
```

- [ ] **Step 2: For each affected file, apply all CRITICAL/HIGH fixes at once**

Work through the triage summary file by file. For each file:

1. Read the file
2. Apply ALL critical and high severity fixes for that file in a single edit pass
3. Run type check to verify:

```bash
pnpm --filter app typecheck
```

4. Run lint check:

```bash
pnpm check
```

5. Commit the file with a message referencing the findings:

```bash
git add <file>
git commit -m "fix(<scope>): apply critical/high review findings

Fixes: <list rule-ids addressed>"
```

Repeat for each affected file.

- [ ] **Step 3: Run full build to verify nothing is broken**

```bash
pnpm build
```

- [ ] **Step 4: Run tests**

```bash
pnpm test
```

---

### Task 7: Implement Medium Severity Fixes

**Files:**
- Modify: Files listed in `05-triage-summary.md` under MEDIUM severity

**Why:** After critical/high fixes are stable and committed, apply medium-priority improvements. Same file-grouped approach.

- [ ] **Step 1: Read the triage summary for MEDIUM items**

```bash
cat docs/superpowers/reviews/05-triage-summary.md
```

- [ ] **Step 2: For each affected file, apply all MEDIUM fixes at once**

Same workflow as Task 6 Step 2:

1. Read the file
2. Apply all medium fixes for that file
3. Type check: `pnpm --filter app typecheck`
4. Lint check: `pnpm check`
5. Commit per file:

```bash
git add <file>
git commit -m "refactor(<scope>): apply medium review findings

Fixes: <list rule-ids addressed>"
```

- [ ] **Step 3: Run full build**

```bash
pnpm build
```

- [ ] **Step 4: Run tests**

```bash
pnpm test
```

---

### Task 8: Update Review Files with Resolution Status

**Files:**
- Modify: `docs/superpowers/reviews/05-triage-summary.md`

**Why:** Close the loop — mark which findings were fixed, which were deferred, and why. This makes the review artifacts useful for future reference.

- [ ] **Step 1: Update the triage summary with resolution status**

Add a `Status` column to each file's findings table:

```markdown
| # | Severity | Source Skill | Rule ID | What to Fix | Status |
|---|----------|-------------|---------|-------------|--------|
| 1 | CRITICAL | react-best-practices | bundle-barrel-imports | ... | FIXED in abc123 |
| 2 | LOW | composition-patterns | ... | ... | DEFERRED — minimal impact |
```

- [ ] **Step 2: Add a resolution summary at the top**

```markdown
## Resolution
- Fixed: [N] findings ([N] critical, [N] high, [N] medium)
- Deferred: [N] findings (low severity, minimal impact)
- View Transitions: Tracked separately in 04-view-transitions.md (not implemented in this pass)
```

- [ ] **Step 3: Commit the updated summary**

```bash
git add docs/superpowers/reviews/05-triage-summary.md
git commit -m "docs: update triage summary with resolution status"
```
