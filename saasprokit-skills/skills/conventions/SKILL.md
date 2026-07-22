---
name: conventions
description: Core conventions for this Next.js 16 monorepo — no barrel imports (import from source files; cn from @repo/design-system/lib/utils), params/searchParams are Promises you MUST await, interface-over-type via Biome's useConsistentTypeDefinitions, and comments that explain why (not what). Read before writing or reviewing any TypeScript/React code.
---

# Code Conventions

Biome (`biome.jsonc:3`) extends `ultracite/core`, `ultracite/react`, and
`ultracite/next`; the only local rule overrides turn `noBarrelFile` off
(`biome.jsonc:10`) and `noNonNullAssertion` off (`biome.jsonc:17`).
Design-system `ui/`, `lib/`, and `hooks/` are excluded from linting
(`biome.jsonc:24-26`). Four rules govern everything else.

## 1. No barrel imports

Import directly from the source file, never a package index. Biome does **not**
flag this (`noBarrelFile` is off), so it is a project convention — enforce it in
review. Use `cn()` for class merging.

```ts
// Correct
import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils"; // utils.ts:6

// Wrong
import { Button } from "@repo/design-system/components/ui";
```

## 2. Async params & searchParams (Next.js 16)

`params` and `searchParams` are **Promises** on every layout, page, and route
handler — the component is `async` and you MUST `await` them. From
`apps/web/app/[locale]/(app)/[orgSlug]/layout.tsx:19-25`:

```tsx
interface OrgLayoutProps {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string; orgSlug: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { locale, orgSlug } = await params; // MUST await

  // Wrong: const { orgSlug } = params;  // params is a Promise, not an object
}
```

## 3. Prefer `interface` over `type`

Biome's `useConsistentTypeDefinitions` (style `"interface"`, inherited from
`ultracite/core` — not set locally in `biome.jsonc`) flags object-shape `type`
aliases. Use `interface` for object shapes; reach for `type` only where the
language requires it — unions, intersections, mapped/conditional types, tuples,
primitive aliases, and inferred results such as `z.infer<>`.

```ts
// Correct
interface LayoutProps { children: ReactNode; params: Promise<Params>; }
type Status = "active" | "archived";             // union — type required
type CreateThingInput = z.infer<typeof schema>;   // inferred — type required

// Wrong
type LayoutProps = { children: ReactNode; params: Promise<Params>; }; // object shape → use interface
```

## 4. Comments explain _why_, not _what_

The identifier is already the documentation — a comment that restates the name
is noise.

```ts
// Wrong — the docblock just paraphrases the name; delete it
/** Accept an invite link. */
export async function acceptInviteLinkAction(...) {}

// Right — no docblock; add a comment only for the non-obvious "why"
export async function acceptInviteLinkAction(...) {
  // Plan seat cap (Stripe) — Better Auth has no billing concept.
  const memberCheck = await canOrgAddMember(inviteLink.organizationId);
}
```

- **No name-restating docblocks.** If a comment's first line paraphrases the function/component/const it sits on, delete that line (and the whole block if that's all it was).
- **Don't duplicate.** Keep the explanation inline, next to the code it explains, not repeated in a header.
- **Prefer inline `//` at the tricky line** — comment the surprising branch, the security check, the reason a call is ordered a certain way.
- **Keep genuine _why_.** Architectural rationale, security notes, race conditions, ownership boundaries — trim only redundant restatement, not the reasoning.
- Applies to `apps/web` and first-party `packages/`. Public-API and prop/field docs may keep a short description where it adds type/usage context beyond the name.

See saasprokit:forms, saasprokit:data-access
