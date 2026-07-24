---
name: forms
description: How to build any form in this repo — the two form recipes (field-form and confirm-button), when useTransition is still correct, and step-by-step scaffolds (schema → action → component). Read before creating or modifying any form.
---

# Forms: the two recipes and how to build them

New here? Every form in this repo submits through React 19 **`useActionState`**,
gated on the hook's own **`isPending`**. There are exactly two recipes plus one
non-form escape hatch. Rationale and the official-docs comparison live in
`reference.md`; a framework-level (repo-agnostic) quick reference is in
`cheatsheet.md`.

The whole system rests on one idea: **one zod schema does three jobs** — client
validation (via `zodResolver`), TypeScript types (via `z.infer`), and the
server-side security check (re-parsed with `safeParse` inside the action). Define
it once in `schemas.ts`; everything else consumes it.

## The one rule about pending

**Never gate a form on `formState.isSubmitting` or `useFormStatus`.** Field-forms
gate on the `isPending` returned by `useActionState`; confirm buttons do too.
`useTransition` is only for interactions that are **not** forms (menu items,
select `onChange`, redirect buttons) — see the last section.

`isPending` from `useActionState` stays true until the action **and** any
revalidation re-render have committed — so the spinner never stops before the
fresh UI paints. `formState.isSubmitting` ends when the action returns, before
the revalidated page arrives; that is why it is banned here.

## Decision tree (start here)

```
Is this a <form> the user submits?
│
├─ NO — it's a menu item / select onChange / a button that just
│        redirects or fires a one-off mutation from a row
│        → NOT a form. Use useTransition (last section).
│
└─ YES ↓
    Does it collect typed input fields?
    ├─ NO  (a confirm / delete / accept / resend button) → Recipe B
    └─ YES (email, name, password, role, …)              → Recipe A
```

## Shared plumbing (already exists — import, don't reinvent)

- `@/lib/forms` — `FormState<TValues, TData>`, `initialFormState`,
  `fieldErrorsFrom(zodError)`.
- `@/hooks/use-action-field-errors` — `useActionFieldErrors(form, state)`
  injects server `fieldErrors` onto the matching RHF fields.
- `@/lib/auth/action-error` — `toFormError(error, { fallback, logger })` and
  `formActionError(code)` return `FormState`-shaped `{ status: "error", error }`
  (the `ActionResult` siblings `toActionError` / `actionError` still exist for
  non-form server functions).

`FormState` shape returned by every form action:

```ts
interface FormState<TValues, TData = never> {
  status: "idle" | "success" | "error";
  error?: string;                                  // root (non-field) message, localized
  fieldErrors?: Partial<Record<keyof TValues & string, string>>;
  data?: TData;                                    // success payload (a slug, a flag, …)
}
```

## Recipe A: field-form (the default for anything with inputs)

Three colocated files (see `saasprokit:data-access` for placement,
`saasprokit:workflows` for the page). Reference implementations:
`account/security/components/change-password-form.tsx` and
`auth/sign-in/components/sign-in-form.tsx`.

### 1. `schemas.ts` — one schema, three jobs

```ts
import { z } from "zod";

export const createThingSchema = z.object({
  name: z.string().min(1).max(100),
});

export type CreateThingValues = z.infer<typeof createThingSchema>;
```

### 2. `actions.ts` — the security boundary

```ts
"use server";

import { hasOrgPermission } from "@/lib/auth/auth";        // or verifySession — see saasprokit:auth
import { formActionError, toFormError } from "@/lib/auth/action-error";
import { fieldErrorsFrom, type FormState } from "@/lib/forms";
import { type CreateThingValues, createThingSchema } from "./schemas";

export type CreateThingFormState = FormState<CreateThingValues, { id: string }>;

export async function createThingAction(
  _prevState: CreateThingFormState,
  input: CreateThingValues
): Promise<CreateThingFormState> {
  const parsed = createThingSchema.safeParse(input);          // 1. re-validate (client zod is UX only)
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    // 2. authorize — identity from the session, never the payload (see saasprokit:auth)
    // 3. mutate
    // 4. revalidate so the response carries fresh UI: await revalidateOrgPage(...)
    return { status: "success", data: { id: thing.id } };
  } catch (error) {
    return toFormError(error, { fallback: "createThing", logger });
  }
}
```

- **Signature is `(prevState, input)`** — `input` is the typed RHF values object
  (NOT `FormData`). Non-field values (an `organizationId`, a `token`) ride along
  in the same object; type them as `CreateThingValues & { organizationId: string }`
  and keep them in the schema so `safeParse` validates them.
- `safeParse` + `fieldErrorsFrom` on failure; `toFormError` in the catch;
  `formActionError("tooManyRequests")` for a caught `RateLimitError`. Failures
  are **returned as state, never thrown**.

### 3. `components/create-thing-form.tsx` — the UX layer

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@repo/design-system/components/ui/form";
import { Input } from "@repo/design-system/components/ui/input";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useActionFieldErrors } from "@/hooks/use-action-field-errors";
import { initialFormState } from "@/lib/forms";
import { createThingAction } from "../actions";
import { type CreateThingValues, createThingSchema } from "../schemas";

export function CreateThingForm({ organizationId }: { organizationId: string }) {
  const [state, formAction, isPending] = useActionState(
    createThingAction,
    initialFormState
  );
  const form = useForm<CreateThingValues>({
    resolver: zodResolver(createThingSchema),
    defaultValues: { name: "" },
  });

  useActionFieldErrors(form, state);                        // server fieldErrors → RHF fields

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Created!");
      form.reset();
    } else if (state.status === "error" && state.error) {
      toast.error(state.error);
    }
  }, [state, form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) =>
          startTransition(() => formAction({ ...values, organizationId }))
        )}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl><Input disabled={isPending} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={isPending} type="submit">Create</Button>
      </form>
    </Form>
  );
}
```

Four non-negotiables:

1. **`form.handleSubmit((values) => startTransition(() => formAction(values)))`** —
   RHF validates first, then dispatches the typed values inside a **top-level
   `startTransition`** (imported from `react`, NOT the `useTransition` hook).
   The transition wrapper is required: dispatching `useActionState`'s action
   outside a transition logs a dev error and `isPending` won't update.
2. Gate every input and the submit button on **`isPending` from `useActionState`**.
3. `useActionFieldErrors(form, state)` for field errors; `state.error` (root)
   goes to a toast, or an inline banner for auth pages.
4. Success/navigation side-effects live in a `useEffect` keyed on `state`.

Auth pages render the root error as an inline banner instead of a toast (see
`sign-in-form.tsx`): `const rootError = state.status === "error" ? state.error : undefined;`

## Recipe B: confirm-button (no input fields)

No fields → no RHF. Keep the existing typed `ActionResult` action and give it a
`useActionState`-compatible surface. References:
`account/danger/components/delete-account-form.tsx` (nullary),
`billing/components/downgrade-button.tsx` (bound args),
`invite/accept/accept-button.tsx` (hidden input).

```tsx
"use client";
import { useActionState, useEffect } from "react";
import { removeThingsFormAction } from "../actions";

export function RemoveThings({ ids }: { ids: string[] }) {
  const boundAction = removeThingsFormAction.bind(null, { ids });   // dynamic args via .bind
  const [state, formAction, isPending] = useActionState(boundAction, null);

  useEffect(() => {
    if (!state) return;
    if (state.success) toast.success("Removed");
    else toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <Button disabled={isPending} type="submit">Remove</Button>
    </form>
  );
}
```

```ts
"use server";
// Bound-args surface for useActionState; keep the typed action if other callers use it.
export async function removeThingsFormAction(
  input: RemoveThingsInput,
  _prevState: ActionResult | null,
  _formData: FormData
): Promise<ActionResult> {
  return await removeThingsAction(input);
}
```

- `<form action={formAction}>` (React auto-wraps it in a transition — no manual
  `startTransition`). Gate on `isPending` from the hook.
- Fixed/dynamic args via `.bind(null, args)` with signature
  `(input, _prevState, _formData)`; nullary flows use a thin
  `(prevState, formData)` wrapper (delete-account pattern).
- A type-to-confirm guard `Input` (e.g. "type the org name to delete") stays
  plain `useState` gating `disabled` — it is **not** submitted and **not** RHF.
- Result handling in a `useEffect` keyed on `state` (guard `if (!state) return`).

## When it is NOT a form: `useTransition`

Some interactions call a server action but aren't a submitted `<form>`. These
keep the `useTransition` hook — it's the officially documented way to invoke an
action from an event handler, and `isPending` still spans the revalidation:

- **Dropdown / menu items** — a `<form>` nested in a `DropdownMenuItem` fights
  Radix focus/close, and a row firing 2–3 actions shouldn't become 2–3 forms
  (`member-actions.tsx`, `invitation-actions.tsx`, `invite-link-actions.tsx`).
- **Select `onChange`** that mutates immediately (`role-selector.tsx`).
- **Buttons that redirect** to Stripe / an OAuth URL, or refresh
  (`billing-actions.tsx`, `manage-billing-form.tsx`, `upgrade-form.tsx`,
  `checkout-refresh-button.tsx`, `org-sidebar.tsx`, `sessions-manager.tsx`).
- **File uploads** — `fetch()` → Route Handler, the one non-server-action
  transport (`logo-upload.tsx`).

```tsx
const [isPending, startTransition] = useTransition();
function onSelect(role: string) {
  startTransition(async () => {
    const result = await updateMemberRoleAction({ organizationId, memberId, role });
    if (!result.success) toast.error(result.error);
  });
}
```

Gotcha: a state update *after* an `await` inside `startTransition` must be
re-wrapped in a nested `startTransition`, or it falls out of the transition.
(Field-forms avoid this entirely — `useActionState` owns the transition.)

## The server-action contract (non-negotiable in EVERY action)

Rendering the form on a protected page is **not** a security boundary — every
action is a public POST endpoint.

- **Validate** — `schema.safeParse(input)`; return `fieldErrors` via
  `fieldErrorsFrom` on failure.
- **Authenticate + authorize** — `verifySession` / `hasOrgPermission`.
- **Ownership from the session, not the payload** — a well-formed input can still
  reference a row the caller doesn't own.
- **Return `FormState`** (form actions) or typed `ActionResult<T>` (non-form
  server functions) shaped to what the UI renders, never raw DB records.
- **`redirect()` throws** — put revalidation calls before it.
- **Auth flows re-apply `enforceRateLimit`** — `auth.api.*` bypasses Better
  Auth's HTTP-path rate limiter, so brute-force protection is re-applied
  server-side (`apps/web/lib/auth/rate-limit.ts`). Do **not** delete those calls.

## Gotchas

- Server actions dispatch **sequentially per client** — never `Promise.all`
  multiple actions from the browser; do parallel work inside one action.
- No barrel imports; async params — see `saasprokit:conventions`.
- Auth forms are **colocated** with their route under
  `apps/web/app/[locale]/auth/*/components/` (shared `AuthCard`,
  `SocialProviders`, and `schemas.ts` live in `auth/components/` + `auth/schemas.ts`).
  There is no design-system auth molecule layer anymore.

See `saasprokit:auth` for `verifySession` / `hasOrgPermission`,
`saasprokit:data-access` for file placement, and `reference.md` here for the
rationale and official-docs comparison.
