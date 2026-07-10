---
name: conventions
description: Code conventions for this repo — no barrel imports, Next.js 16 async params, and interface-over-type. Read before writing or reviewing any TypeScript/React code in this repo.
---

# Code Conventions

## No Barrel Imports

Always import directly from source files:

```typescript
// Correct
import { Button } from "@repo/design-system/components/ui/button";

// Wrong
import { Button } from "@repo/design-system/components/ui";
```

Use `cn()` utility from `@repo/design-system/lib/utils` for class merging.

## Server Components & Async Params (Next.js 16)

All layout and page components use async function syntax to access `params` — it is a Promise and MUST be awaited:

```typescript
type LayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string; orgSlug: string }>;
};

const Layout = async ({ children, params }: LayoutProps) => {
  const { locale, orgSlug } = await params;  // MUST await params!
  return <>{children}</>;
};
```

## TypeScript

**Prefer `interface` over `type` for object shapes** (enforced by Biome's `useConsistentTypeDefinitions`). Use `type` only when the language requires it: unions, intersections, mapped/conditional types, tuple types, primitive aliases, and `z.infer<>` / other inferred results.
