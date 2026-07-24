---
name: forms
description: How to build any form in this repo — the two form recipes (field-form and confirm-button), when useTransition is still correct, and step-by-step scaffolds (schema → action → component). Read before creating or modifying any form.
---

# Forms: the two recipes and how to build them

Every form submits through React 19 **`useActionState`**, gated on the hook's
own **`isPending`** — never on `formState.isSubmitting` or `useFormStatus`
(`isSubmitting` ends before the revalidated UI paints; the full pending-signal
comparison is in `reference.md`). One zod schema does three jobs: client
validation (`zodResolver`), types (`z.infer`), and the server security check
(`safeParse` inside the action).

## Decision tree (start here)

```
Is this a <form> the user submits?
│
├─ NO — a menu item / select onChange / a button that redirects
│        or fires a one-off mutation / a file upload
│        → NOT a form. Use useTransition (see below).
│
└─ YES ↓
    Does it collect typed input fields?
    ├─ NO  (a confirm / delete / accept / resend button) → Recipe B
    │       (dynamic client state like selected row ids rides .bind — still B)
    └─ YES (email, name, password, role, …)              → Recipe A
```

Public first-visit pages that must accept a pre-hydration submit are the one
exception — see "Hybrid public form" in `reference.md`.

## Shared plumbing (already exists — import, don't reinvent)

- `@/lib/forms` — `FormState<TValues, TData>`, `initialFormState`,
  `fieldErrorsFrom(zodError)`.
- `@/hooks/use-action-field-errors` — `useActionFieldErrors(form, state)`
  injects server `fieldErrors` onto the matching RHF fields.
- `@/hooks/use-action-result` — `useActionResult(state, { onSuccess, onError })`
  runs the result side-effect **exactly once per action result**. Use it instead
  of a hand-rolled `useEffect`; see "Never hand-roll the result effect" below.
- `@/lib/auth/action-error` — `toActionError(error, { fallback, logger })` for
  catch blocks, `actionError(code)` for guards. One pair for every action: the
  returned failure carries both discriminants (`success: false` AND
  `status: "error"`), so it satisfies `ActionResult` and `FormState` alike.

```ts
interface FormState<TValues, TData = never> {
  status: "idle" | "success" | "error";
  error?: string;                                  // root (non-field) message, localized
  code?: string;                                   // machine-readable: BA code or ActionErrorCode
  fieldErrors?: Partial<Record<keyof TValues & string, string>>;
  data?: TData;                                    // success payload (a slug, a flag, …)
}
```

## Recipe A: field-form (the default for anything with inputs)

Three colocated files (placement: `saasprokit:data-access`; page:
`saasprokit:workflows`). Reference implementations:
`account/security/components/change-password-form.tsx` and
`auth/sign-in/components/sign-in-form.tsx`.

### 1. `schemas.ts`

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
import { actionError, toActionError } from "@/lib/auth/action-error";
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
    return toActionError(error, { fallback: "createThing", logger });
  }
}
```

- **Signature is `(prevState, input)`** — `input` is the typed RHF values object
  (NOT `FormData`). Non-field values (an `organizationId`, a `token`) ride along:
  type them as `CreateThingValues & { organizationId: string }`, and give every
  ride-along **one** of (a) a place in the schema so `safeParse` validates it
  (`members/schemas.ts`: full schema, `.pick()` the form fields) or (b) an
  explicit sanitizer at the point of use (`resolveCallbackUrl` for auth
  `callbackUrl`; Better Auth itself validates a reset `token` / OTP `email`).
  Never neither.
- `actionError("tooManyRequests")` for a caught `RateLimitError`. Failures
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
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useActionFieldErrors } from "@/hooks/use-action-field-errors";
import { useActionResult } from "@/hooks/use-action-result";
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

  useActionResult(state, {                                  // fires once per result
    onSuccess: () => { toast.success("Created!"); form.reset(); },
    onError: (error) => toast.error(error ?? "Something went wrong"),
  });

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
   dispatch inside the **top-level `startTransition`** (imported from `react`,
   NOT the `useTransition` hook), or `isPending` won't update and dev logs an
   error.
2. Gate every input and the submit button on **`isPending` from `useActionState`**.
3. `useActionFieldErrors(form, state)` for field errors; `state.error` (root)
   goes to a toast — or an inline banner on auth pages (see `sign-in-form.tsx`:
   `const rootError = state.status === "error" ? state.error : undefined;`).
4. Success/navigation side-effects go in `useActionResult` — never a hand-rolled
   `useEffect` (see below).

## Recipe B: confirm-button (no input fields)

No fields → no RHF. Keep the typed `ActionResult` action and give it a
`useActionState`-compatible surface. References:
`account/danger/components/delete-account-form.tsx` (nullary),
`billing/components/downgrade-button.tsx` (bound args),
`invite/accept/accept-button.tsx` (hidden input).

```tsx
"use client";
import { useActionState } from "react";
import { useActionResult } from "@/hooks/use-action-result";
import { removeThingsFormAction } from "../actions";

export function RemoveThings({ ids }: { ids: string[] }) {
  const boundAction = removeThingsFormAction.bind(null, { ids });   // dynamic args via .bind
  const [state, formAction, isPending] = useActionState(boundAction, null);

  useActionResult(state, {                     // null/idle skipped — no `if (!state)` guard
    onSuccess: () => toast.success("Removed"),
    onError: (error) => toast.error(error ?? "Something went wrong"),
  });

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

- `<form action={formAction}>` — React auto-wraps it in a transition; no manual
  `startTransition`. Gate on `isPending` from the hook.
- Args via `.bind(null, args)` with signature `(input, _prevState, _formData)`;
  nullary flows use a thin `(prevState, formData)` wrapper (delete-account).
- A type-to-confirm guard `Input` ("type the org name to delete") stays plain
  `useState` gating `disabled` — not submitted, not RHF.

## Never hand-roll the result effect

```tsx
// WRONG — replays the stale result every time an unrelated action revalidates
useEffect(() => {
  if (state.status === "success") toast.success("Saved");
}, [state, form, errors]);
```

`state` never resets to idle, and `errors` (`dict.errors.action`) gets a new
object identity from every `revalidatePath` — so the effect re-fires against the
old terminal state (duplicate success toasts; an unstable `onSuccess` prop does
the same). `useActionResult` guards on the last-handled state object and keeps
handlers in a ref, so unstable deps cannot replay a result, while a genuine
resubmit (fresh state object) still fires.

**`onError` does not fire for a `fieldErrors`-only failure** — those render
inline via `useActionFieldErrors`; toasting would stack a vaguer duplicate on
the precise field message.

## When it is NOT a form: `useTransition`

Interactions that call a server action but aren't a submitted `<form>` keep the
`useTransition` hook (its `isPending` also spans the revalidation):

- **Dropdown / menu items** — a nested `<form>` fights Radix focus/close
  (`member-actions.tsx`, `invitation-actions.tsx`, `invite-link-actions.tsx`).
- **Select `onChange`** that mutates immediately (`role-selector.tsx`).
- **Buttons that redirect** to Stripe / OAuth, or refresh
  (`billing-actions.tsx`, `sessions-manager.tsx`, `org-sidebar.tsx`, …).
- **File uploads** — `fetch()` → Route Handler, the one non-server-action
  transport (`logo-upload.tsx`).

```tsx
const [isPending, startTransition] = useTransition();
function onSelect(role: string) {
  startTransition(async () => {
    const result = await updateMemberRoleAction({ organizationId, memberId, role });
    startTransition(() => {
      // Gotcha: state updates AFTER an await must be re-wrapped in a nested
      // startTransition, or they commit before the revalidated UI does.
      if (result.success) setOpen(false);
    });
    if (!result.success) toast.error(result.error);
  });
}
```

## The server-action contract (non-negotiable in EVERY action)

Rendering the form on a protected page is **not** a security boundary — every
action is a public POST endpoint.

- **Validate** — `schema.safeParse(input)`; return `fieldErrors` via
  `fieldErrorsFrom` on failure.
- **Authenticate + authorize** — `verifySession` / `hasOrgPermission`.
- **Ownership from the session, not the payload** — a well-formed input can
  still reference a row the caller doesn't own.
- **Return `FormState`** (form actions) or typed `ActionResult<T>` (non-form
  server functions) shaped to what the UI renders, never raw DB records.
- **`redirect()` throws** — put revalidation calls before it.
- **Auth flows re-apply `enforceRateLimit`** — `auth.api.*` bypasses Better
  Auth's HTTP-path rate limiter, so brute-force protection is re-applied
  server-side (`apps/web/lib/auth/rate-limit.ts`). Do **not** delete those calls.
- Server actions dispatch **sequentially per client** — never `Promise.all`
  actions from the browser; parallelize inside one action.

Auth forms are **colocated** under `apps/web/app/[locale]/auth/*/components/`
(shared `AuthCard`/`SocialProviders` in `auth/components/`, schemas in
`auth/schemas.ts`) — there is no design-system auth layer. No barrel imports,
async params: `saasprokit:conventions`.

See `saasprokit:auth` for the auth helpers and `reference.md` here for the
rationale, pending-signal semantics, and the official-docs comparison.
