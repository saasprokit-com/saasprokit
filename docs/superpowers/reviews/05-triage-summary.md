# Triage Summary -- 2026-04-16

## Stats
- Total unique findings: 86 (after dedup from reviews 01-03; 1 non-finding excluded from review 02)
- By severity: Critical 8 | High 24 | Medium 34 | Low 20
- Files affected: 25

## Findings Grouped by File

### apps/web/app/[locale]/(frontier)/home-page-client.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | HIGH | react-best-practices | bundle-barrel-imports | 12 lucide-react icons imported in a "use client" component; all ship to browser. Consider lazy loading or inlining SVGs. |
| 2 | HIGH | react-best-practices | bundle-dynamic-imports | `StyleConfigurator` eagerly imported but hidden on mobile by default; use `next/dynamic` with `ssr: false`. |
| 3 | MEDIUM | react-best-practices | rendering-conditional-render | `plan.badge && (...)` pattern can render empty string as text; use ternary. |
| 4 | MEDIUM | react-best-practices | server-hoist-static-io | 100+ lines of static data arrays (`features`, `techStack`, `planCtas`) inflate the client bundle unnecessarily. Move to server or constants file. |
| 5 | MEDIUM | web-design-guidelines | typography/ellipsis | `"Try it now..."` uses three dots instead of ellipsis character. |
| 6 | MEDIUM | web-design-guidelines | accessibility/heading-hierarchy | Major sections lack `<h2>` landmarks; screen reader navigation impaired. |
| 7 | MEDIUM | web-design-guidelines | accessibility/skip-link | No skip-to-content link; keyboard users must tab through entire header. |
| 8 | LOW | react-best-practices | rendering-content-visibility | Features and tech stack grids rendered eagerly below the fold; add `content-visibility: auto`. |
| 9 | LOW | react-best-practices | js-batch-dom-css | CSS variable `setProperty` loop triggers multiple style recalcs; batch into single call. |
| 10 | LOW | web-design-guidelines | typography/text-wrap | `<h1>` heading missing `text-balance` or `text-pretty` to prevent orphans. |
| 11 | LOW | web-design-guidelines | design-md/spacing | Feature blocks use `p-8` (32px) below DESIGN.md minimum of `p-10` (40px). |
| 12 | LOW | web-design-guidelines | design-md/spacing | Tech stack blocks use `p-8` (32px) below DESIGN.md minimum of `p-10` (40px). |
| 13 | LOW | web-design-guidelines | navigation/url-state | Style configurator state not synced to URL; configurations not shareable/bookmarkable. |

### packages/design-system/components/ui/sidebar.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | HIGH | composition-patterns | react19-use-instead-usecontext | `useSidebar()` uses `React.useContext` instead of React 19 `use()` API. |
| 2 | MEDIUM | composition-patterns | architecture-avoid-boolean-props | `SidebarMenuButton` has 3 boolean props (asChild, isActive, tooltip); at threshold. Monitor for growth. |
| 3 | MEDIUM | composition-patterns | architecture-avoid-boolean-props | `SidebarMenuSkeleton` accepts `showIcon` boolean; could use children/slot but pragmatic. |
| 4 | MEDIUM | react-best-practices | rerender-functional-setstate | `setOpen` callback closes over `open` state, causing context value to change on every toggle. |
| 5 | MEDIUM | web-design-guidelines | animation/transition-all | Sidebar menu button outline variant uses box-shadow transitions; not compositor-friendly. |
| 6 | LOW | composition-patterns | state-context-interface | `SidebarContextProps` mixes state and actions in flat interface without grouping. |

### apps/web/app/[locale]/auth/sign-in/sign-in-client.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | CRITICAL | web-design-guidelines | accessibility/aria-live | Error/success messages (magic link, OTP) have no `aria-live` region; screen readers won't announce state changes. |
| 2 | HIGH | web-design-guidelines | design-md/shadow | Magic link tab uses `shadow-sm`; violates DESIGN.md shadow prohibition. |
| 3 | HIGH | web-design-guidelines | design-md/border-radius | Mixed `rounded-lg` and hardcoded `rounded-md` usage; inconsistent radius approach. |
| 4 | HIGH | web-design-guidelines | design-md/shadow | OTP tab content uses `shadow-sm`. |
| 5 | HIGH | web-design-guidelines | forms/spellcheck | Magic link email input missing `spellCheck={false}`. |
| 6 | HIGH | web-design-guidelines | forms/autocomplete | Magic link email input missing `autoComplete="email"`. |
| 7 | HIGH | web-design-guidelines | forms/autocomplete | OTP email input missing `autoComplete="email"`. |
| 8 | MEDIUM | web-design-guidelines | typography/ellipsis | `"Sending..."` and similar loading states use three dots instead of ellipsis character. |
| 9 | MEDIUM | web-design-guidelines | design-md/color | Uses `bg-gray-50 dark:bg-gray-900` instead of `bg-background` token. |
| 10 | MEDIUM | web-design-guidelines | forms/controlled-inputs | Controlled inputs without debouncing (acceptable since handlers are trivial setState). |
| 11 | LOW | web-design-guidelines | content/copy-voice | Magic link description uses first person ("We'll send you..."); should use second person. |
| 12 | LOW | web-design-guidelines | content/copy-voice | OTP description uses first person ("We'll send you..."). |

### packages/design-system/components/blocks/hero/hero.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | CRITICAL | web-design-guidelines | design-md/gradient-violation | Uses `bg-gradient-to-b from-primary/5`; DESIGN.md forbids gradients. |
| 2 | CRITICAL | web-design-guidelines | design-md/decorative-blob | Background uses blurred circle (`blur-3xl`); violates anti-pattern list. |
| 3 | HIGH | web-design-guidelines | design-md/centered-layout | Hero centers all content with `text-center`; DESIGN.md says left-align by default. |
| 4 | MEDIUM | composition-patterns | architecture-avoid-boolean-props | `showGradientBackground` boolean controls rendering logic; split into variants or use composition. |
| 5 | MEDIUM | composition-patterns | patterns-children-over-render-props | Props-driven monolithic API; should refactor to compound component pattern. |
| 6 | MEDIUM | web-design-guidelines | design-md/font-weight | Title uses `font-bold` (700); DESIGN.md specifies `font-semibold` (600). |
| 7 | LOW | web-design-guidelines | typography/text-wrap | `<h1>` missing `text-balance` or `text-pretty`. |

### packages/design-system/components/ui/chart.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | HIGH | composition-patterns | react19-use-instead-usecontext | `useChart()` uses `React.useContext(ChartContext)` instead of `use()`. |
| 2 | MEDIUM | composition-patterns | architecture-avoid-boolean-props | `ChartTooltipContent` has negative booleans (`hideLabel`, `hideIndicator`); prefer positive `show` pattern or `parts` object. |
| 3 | MEDIUM | composition-patterns | architecture-avoid-boolean-props | `ChartLegendContent` has `hideIcon` negative boolean; inconsistent with rest of chart API. |

### apps/web/app/[locale]/(app)/[orgSlug]/layout.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | CRITICAL | react-best-practices | async-waterfalls | Sequential waterfall: two `Promise.all` blocks in series; `requireAuth()` is independent but waits for first batch. Merge into single `Promise.all`. |
| 2 | HIGH | react-best-practices | server-dedup-props | `validateOrgMembershipBySlug` called in layout and again in child pages; verify `React.cache` wrapping to avoid duplicate DB queries. |

### apps/web/app/[locale]/auth/sign-in/sign-in-form.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | CRITICAL | web-design-guidelines | accessibility/aria-live | Root form error alert lacks `role="alert"` or `aria-live`; screen readers not informed of failures. |
| 2 | HIGH | web-design-guidelines | forms/spellcheck | Email input missing `spellCheck={false}`. |
| 3 | MEDIUM | web-design-guidelines | typography/ellipsis | `"Signing in..."` uses three dots instead of ellipsis character. |
| 4 | MEDIUM | web-design-guidelines | forms/placeholder-pattern | Password placeholder `"Enter your password"` missing trailing ellipsis. |

### apps/web/app/[locale]/auth/sign-up/sign-up-form.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | CRITICAL | web-design-guidelines | accessibility/aria-live | Root error container has no ARIA live region; sign-up errors invisible to screen readers. |
| 2 | HIGH | web-design-guidelines | forms/spellcheck | Email input missing `spellCheck={false}`. |
| 3 | MEDIUM | web-design-guidelines | typography/ellipsis | `"Creating account..."` uses three dots instead of ellipsis character. |
| 4 | MEDIUM | web-design-guidelines | forms/placeholder-pattern | Password placeholder `"Create a strong password"` missing trailing ellipsis. |
| 5 | MEDIUM | web-design-guidelines | forms/placeholder-pattern | Confirm password placeholder `"Confirm your password"` missing trailing ellipsis. |

### packages/design-system/components/ui/form.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | HIGH | composition-patterns | react19-use-instead-usecontext | `useFormField()` has two `React.useContext` calls; replace both with `React.use()`. |

### packages/design-system/components/ui/carousel.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | HIGH | composition-patterns | react19-use-instead-usecontext | `useCarousel()` uses `React.useContext(CarouselContext)` instead of `use()`. |

### packages/design-system/components/ui/toggle-group.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | HIGH | composition-patterns | react19-use-instead-usecontext | `ToggleGroupItem` uses `React.useContext` inline; replace with `use()` and extract a named hook. |

### packages/design-system/components/ui/card.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | HIGH | web-design-guidelines | design-md/border-radius | Card has `rounded-xl` hardcoded; should use `rounded-lg` which maps to `var(--radius)`. |
| 2 | HIGH | web-design-guidelines | design-md/shadow | Card includes `shadow-sm`; DESIGN.md says use borders instead of shadows. |

### apps/web/app/[locale]/(frontier)/page.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | HIGH | react-best-practices | server-serialization | Entire `PlanConfig[]` serialized to client; only 6 fields are used. Select needed fields before passing. |

### apps/web/app/[locale]/(app)/[orgSlug]/page.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | CRITICAL | react-best-practices | async-waterfalls | Two sequential awaits; dashboard data fetch waits for membership validation. Use Suspense to stream. |

### apps/web/app/[locale]/(app)/[orgSlug]/settings/page.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | CRITICAL | react-best-practices | async-waterfalls | `getDictionary(locale)` serialized behind `validateOrgMembershipBySlug` unnecessarily; start dictionary fetch in parallel. |

### packages/design-system/components/blocks/style-configurator/style-configurator.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | MEDIUM | react-best-practices | bundle-defer-third-party | Google Font link injected via `createElement("link")` in useEffect with no cleanup; font links accumulate as a memory leak. |
| 2 | LOW | react-best-practices | advanced-init-once | Font change creates new link elements without removing old ones; accumulated links are a resource leak. |

### packages/design-system/components/blocks/style-configurator/use-style-config.ts
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | MEDIUM | composition-patterns | state-decouple-implementation | Hook couples CSS variable computation to useState; should use context provider pattern to decouple. |
| 2 | MEDIUM | react-best-practices | js-combine-iterations | Two separate `for...of` loops over color entries; simplify with `Object.assign` spread. |

### packages/design-system/components/layout/org-switcher.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | MEDIUM | react-best-practices | rerender-derived-state-no-effect | `useState` + `useEffect` syncs prop to state (extra re-render anti-pattern); derive directly instead. |

### packages/design-system/components/molecules/footer/footer.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | MEDIUM | react-best-practices | rerender-memo-with-default-value | Default `[]` array literals in destructuring break shallow comparison; hoist to module-level constants. |
| 2 | LOW | composition-patterns | architecture-avoid-boolean-props | `FooterLink.external` boolean controls `<a>` vs `<Link>` rendering; pragmatic and contained. |
| 3 | LOW | composition-patterns | architecture-compound-components | Props-driven data arrays; could be compound components but data-driven is reasonable for footer. |
| 4 | LOW | web-design-guidelines | hydration/date-mismatch | `new Date().getFullYear()` in client component; theoretical hydration mismatch at year boundary. |

### packages/design-system/hooks/use-mobile.ts
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | MEDIUM | react-best-practices | rendering-hydration-no-flicker | Initializes with `null`, returns `false` until effect runs; causes hydration mismatch and layout shift on mobile. |

### packages/design-system/components/layout/breadcrumb-context.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | MEDIUM | composition-patterns | react19-use-instead-usecontext | `useBreadcrumbContext()` uses `useContext` instead of `use()`. |
| 2 | MEDIUM | react-best-practices | rerender-no-inline-components | `_itemsKey` (JSON.stringify) not used in effect dependency array; items reference triggers unnecessary re-renders. |
| 3 | LOW | composition-patterns | state-context-interface | `BreadcrumbContextValue` exposes raw `setItems` setter; should wrap behind named actions. |

### packages/design-system/components/ui/input-otp.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | MEDIUM | composition-patterns | react19-use-instead-usecontext | `InputOTPSlot` uses `React.useContext(OTPInputContext)` instead of `use()`. |

### packages/design-system/components/ui/button.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | MEDIUM | web-design-guidelines | animation/transition-all | Base class uses `transition-all`; replace with explicit `transition-colors`. |
| 2 | MEDIUM | web-design-guidelines | touch/touch-action | Missing `touch-action: manipulation`; causes 300ms tap delay on mobile. |

### packages/design-system/components/blocks/pricing/pricing.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | HIGH | web-design-guidelines | design-md/shadow | Popular tier uses `shadow-lg ring-2`; DESIGN.md prohibits shadows. Replace with border-based highlight. |
| 2 | HIGH | web-design-guidelines | design-md/centered-layout | Section uses `text-center`; violates left-align-by-default convention. |
| 3 | LOW | web-design-guidelines | typography/text-wrap | `<h2>` heading lacks `text-balance`. |

### packages/design-system/components/ui/mode-toggle.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | MEDIUM | web-design-guidelines | animation/prefers-reduced-motion | Sun/Moon icon rotation animations do not honor `prefers-reduced-motion`. |
| 2 | MEDIUM | web-design-guidelines | animation/transition-all | Uses `transition-all` on icon animations; replace with `transition-[transform,opacity]`. |

### apps/web/app/[locale]/auth/sign-up/sign-up-client.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | MEDIUM | web-design-guidelines | design-md/color | Uses `bg-gray-50 dark:bg-gray-900` instead of `bg-background` token. |

### packages/design-system/components/blocks/style-configurator/color-presets.ts
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | MEDIUM | web-design-guidelines | design-md/violet-anti-pattern | Violet included as accent color option; DESIGN.md anti-patterns list "purple/violet anything." |

### packages/design-system/components/ui/pagination.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | LOW | composition-patterns | patterns-explicit-variants | `isActive` boolean maps to `aria-current="page"`; standard pagination pattern, no change needed. |

### packages/design-system/styles/globals.css
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | LOW | web-design-guidelines | accessibility/color-scheme | Missing `color-scheme: light dark` on `:root`; browser chrome may not reflect light theme. |

### apps/web/app/[locale]/(app)/account/new-org/page.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | HIGH | react-best-practices | async-waterfalls | Minor waterfall: `canUserCreateOrg` depends on session but `getDictionary` could be pipelined earlier. |

### packages/design-system/components/molecules/footer/simple-footer.tsx
| # | Severity | Source Skill | Rule ID | What to Fix |
|---|----------|-------------|---------|-------------|
| 1 | LOW | web-design-guidelines | hydration/date-mismatch | `new Date().getFullYear()` theoretical hydration mismatch at year boundary. |

## Duplicates Removed
- **No exact duplicates found** (same file + same line + same issue across reviews). All 86 findings are unique.

### Cross-Review Overlaps (kept both, different concerns on same code)
- **hero.tsx** -- Review 01 flags `showGradientBackground` as a boolean prop architecture issue (`architecture-avoid-boolean-props`); Review 03 flags the gradient itself as a DESIGN.md violation (`design-md/gradient-violation`). Both kept: fixing the design violation (removing the gradient) would also resolve the boolean prop issue, but they represent different review dimensions.
- **style-configurator.tsx** -- Review 02 has two findings on the same font link injection code (lines 49-64 and 55-58): `bundle-defer-third-party` covers missing cleanup logic, `advanced-init-once` covers accumulated link elements. These describe the same root cause (font links not cleaned up) from different angles within the same review.
- **use-style-config.ts** -- Review 01 flags state/context decoupling (`state-decouple-implementation`); Review 02 flags iteration efficiency (`js-combine-iterations`). Different concerns on the same file.

### Non-Finding Excluded
- Review 02, `rerender-lazy-state-init` on sidebar.tsx:612 -- explicitly states "No issue here" and "Fix: None needed." Excluded from count.

## View Transitions (Separate Track)
View transitions are additive features, not fixes. See 04-view-transitions.md for the full implementation plan. Summary:
- 22 files to modify (+ 1 optional new file for reusable `PageTransition` wrapper)
- 7 CSS recipes to add (fade, slide-vertical, nav-forward, nav-back, shared morph, text morph, persistent element isolation + reduced motion)
- Config: `next.config.ts` experimental flag `viewTransition: true` needed
- Priority tiers: P1 persistent elements (4 headers/sidebars + 1 main content), P2 route transitions (10 pages), P3 Suspense reveals (9 loading/Suspense boundaries), P4 shared elements (deferred -- no good candidates currently), P5 programmatic navigation fixes (3 files with `router.push` needing `startTransition`), P6 reusable component (optional)
