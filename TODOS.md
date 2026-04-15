# TODOS

## P3: Minimal variants for block components

**What:** Add `variant='minimal'` prop to Hero and FeaturesGrid block components to disable decorative elements (gradients, badges, busy grids).

**Why:** The homepage simplification (Approach A) reuses existing block components as-is. If the result still feels too busy compared to the Vercel aesthetic target, minimal variants provide a clean path to tighter styling without a full component rewrite.

**Context:** This was identified during the CEO review of the homepage redesign plan. The design doc acknowledges this as a "known limitation" of Approach A and suggests partial Approach C as a follow-up.

**Effort:** S (CC: ~15 min)
**Depends on:** Homepage simplification shipping first
**Files:** `packages/design-system/components/blocks/hero/hero.tsx`, `packages/design-system/components/blocks/features-grid/features-grid.tsx`
