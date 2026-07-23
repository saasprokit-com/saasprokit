---
name: forms
description: How to build any form in this repo — the ways to submit to the server, the six named form patterns, a decision tree, and step-by-step scaffold recipes (schema → action → component). Read before creating or modifying any form.
---

# Forms: ways to submit, patterns, and recipes

New here? This skill answers three questions: **how many ways can a form reach
the server, which pattern do I pick, and how do I build it.** Rationale and the
official-docs comparison live in `reference.md` beside this file; a
framework-level (React 19 + Next.js, repo-agnostic) how/where/when quick
reference — the five APIs, pending semantics, and top mistakes — is in
`cheatsheet.md`.

The whole system rests on one idea: **one zod schema does three jobs** — client
validation (via `zodResolver`), TypeScript types (via `z.infer`), and the
server-side security check (re-parsed inside the action). You define it once in
`schemas.ts`; everything else consumes it.

**Architecture default: server-render + server actions.** Every mutation is a
**server action** (`auth.api.*` / typed action returning `ActionResult<T>`) —
including **all auth flows** (sign-in/up, social, magic-link, OTP, forgot/reset
password, verify-email, 2FA, change-password) and all billing. A direct
`auth.api.*` call **bypasses** Better Auth's per-route rate limits (they run only
on the HTTP `/api/auth/*` path), so brute-force protection is **re-applied
server-side** via `enforceRateLimit` in
[apps/web/lib/auth/rate-limit.ts](apps/web/lib/auth/rate-limit.ts) — a port of
Better Auth's own DB `consume()`. **Do not remove those `enforceRateLimit` calls
believing the client transport still protects these flows: it doesn't; they are
server actions now.** The only client-side API exception is **`fetch()` → Route
Handler** for **file uploads**. For the pending signal, reach for
**`useTransition`** (programmatic / dialog / confirmation) or **`useActionState`**
(fieldless / public); `formState.isSubmitting` is valid only when the action
neither revalidates nor navigates (the auth molecules are the documented
exception — they own RHF + `isSubmitting` and the injected handler navigates).

## Decision tree (start here)

```
Does the form have input fields the user fills in?
  └─ NO (just a confirm/cancel/accept button) → confirmation form
  └─ YES ↓

Does it live in a Dialog / popover?
  └─ YES → dialog form   (RHF + zodResolver + startTransition)
  └─ NO ↓

Is it a reusable UI component shared across apps / in the design system?
  └─ YES → molecule form (injected onSubmit prop)
  └─ NO ↓

Is it a PUBLIC page that must work before hydration / without JS?
  └─ YES → hybrid public form (native <form action> fallback + RHF)
  └─ NO  → colocated form   ← the default for authenticated app forms
```

## The 5 ways to reach the server (client transports)

| # | Transport | Use it for | Pending signal |
|---|---|---|---|
| 1 | `<form action={fn}>` + `useActionState` | fieldless confirmations; public forms (progressive enhancement) | `pending` from `useActionState` (auto-transition) |
| 2 | Programmatic call in `startTransition` | dialogs, menu items, buttons that call a typed action | `isPending` from `useTransition` |
| 3 | RHF `onSubmit` → `await action()` | colocated forms whose action does **not** revalidate/navigate | `formState.isSubmitting` |
| 4 | Better Auth client (`signIn.*`, `changePassword`, …) | **Not used in this repo** — all auth flows are server actions (transport 3) with server-side `enforceRateLimit`. Better Auth's own client transport, listed for orientation only. | — |
| 5 | `fetch()` → Route Handler (`/api/*`) | **file uploads ONLY** | local `useState`/`useTransition` |

Rows 1–3 are **server actions — the default**. Row 5 is the one client-API
**exception** (file uploads). Row 4 (BA client) is **no longer used for
mutations here** — grep confirms zero `@repo/auth/client` mutation imports.

**`isSubmitting` vs `isPending` rule:** `formState.isSubmitting` ends when the
action *returns*. If the action calls `revalidatePath`/`revalidateOrgPage`, the
fresh page commits *after* that — so use `useTransition`'s `isPending` (or
`useActionState`'s `pending`), which stays true "until the final state is shown
to the user." Only rely on `isSubmitting` when the action neither revalidates
nor navigates.

**Server targets:** typed Server Action returning `ActionResult<T>` (the
default) · FormData-shaped Server Action (for transports 1 & the hybrid) ·
Route Handler (transport 5, file uploads).

## The 6 form patterns

| Pattern | What it is | Canonical example |
|---|---|---|
| **colocated form** | RHF + zodResolver + typed server action, files colocated with the feature. The default. | `apps/web/app/[locale]/(app)/account/new-org/components/create-organization-form.tsx` |
| **molecule form** | Design-system component; `onSubmit: (data) => Promise<void>` injected by the app. Reusable, app-agnostic. | `packages/design-system/components/molecules/auth/sign-in-form.tsx` |
| **molecule + server action** | A design-system molecule whose injected `onSubmit` calls a **server action** (not the BA client), throwing on `!result.success` so the molecule's root-error banner still fires. All auth flows. | `apps/web/app/[locale]/auth/sign-in/components/password-sign-in.tsx` |
| **dialog form** | RHF + zodResolver inside a Dialog, action wrapped in `startTransition`. | Recipe 2 — *no compliant example yet; the 5 existing dialogs are legacy (see below)* |
| **confirmation form** | Fieldless. `<form action>`+`useActionState` for a fixed/public target, or `useTransition` for dynamic ids / menu items (see Recipe 3 for the ordered rule). | `apps/web/app/[locale]/(app)/invite/accept/accept-button.tsx` |
| **hybrid public form** | Native `<form action>` fallback + RHF enhancement; `safeParse` + field errors. Public/no-JS surfaces. | Recipe 4 — *no public forms in the repo yet* |

## Recipe 1: colocated form (the default)

Three colocated files (see `saasprokit:data-access` for placement,
`saasprokit:workflows` for the page).

### 1. `schemas.ts` — one schema, three jobs

```ts
import { z } from "zod";

export const createThingSchema = z.object({
  name: z.string().min(1).max(100),
  // reuse shared validators where they exist, e.g. slugSchema from @repo/utils/slug
});

export type CreateThingInput = z.infer<typeof createThingSchema>;
```

### 2. `actions.ts` — the security boundary

```ts
"use server";

import { verifySession } from "@/lib/auth/action-auth";           // personal-scoped
// OR: import { hasOrgPermission } from "...";                  // org-scoped — see saasprokit:auth
import { actionError, toActionError } from "@/lib/auth/action-error";
import type { ActionResult } from "@/lib/auth/auth";
import { type CreateThingInput, createThingSchema } from "./schemas";

export async function createThingAction(
  input: CreateThingInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const validated = createThingSchema.parse(input);          // 1. validate (client check is UX only)
    const { session, error } = await verifySession<{ id: string }>();  // 2. authenticate
    if (error) return error;
    // 3. authorize — org-scoped: hasOrgPermission(validated.organizationId, {...})
    //    identity comes from the session, never from the input
    // 4. mutate
    // 5. revalidate so the response carries fresh UI (single roundtrip):
    //    await revalidateOrgPage(validated.orgSlug, ORG_PAGES.X)
    return { success: true, data: { id: thing.id } };
  } catch (error) {
    return toActionError(error, { fallback: "invalidInput" });
  }
}
```

### 3. `components/create-thing-form.tsx` — the UX layer

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@repo/design-system/components/ui/form";
import { Input } from "@repo/design-system/components/ui/input";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createThingAction } from "../actions";
import { type CreateThingInput, createThingSchema } from "../schemas";

export function CreateThingForm() {
  const form = useForm<CreateThingInput>({
    resolver: zodResolver(createThingSchema),
    defaultValues: { name: "" },
  });
  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: CreateThingInput) {
    const result = await createThingAction(values);
    if (!result.success) {
      // field-level when the error belongs to a field, toast otherwise
      toast.error(result.error ?? "Something went wrong");
      return;
    }
    toast.success("Created!");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl><Input {...field} disabled={isSubmitting} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={isSubmitting} type="submit">Create</Button>
      </form>
    </Form>
  );
}
```

Conventions: disable inputs with `isSubmitting`; map server errors to
`form.setError("field", ...)` when they belong to a field (see
`create-organization-form.tsx` for the pattern), sonner toast otherwise. If the
action revalidates, use Recipe 2's transition instead of `isSubmitting`.

## Recipe 2: dialog form (RHF + `startTransition`)

Same `schemas.ts` / `actions.ts` as Recipe 1. Keep RHF for validation, wrap the
action call in `startTransition` so `isPending` covers the server roundtrip AND
the router applying the revalidated page (the spinner won't stop before the
table updates).

```tsx
const [isPending, startTransition] = useTransition();
const form = useForm<InviteInput>({ resolver: zodResolver(inviteSchema) });

function onSubmit(values: InviteInput) {
  startTransition(async () => {
    const result = await inviteMemberAction(values);
    // React limitation: state updates AFTER an await must be re-wrapped
    startTransition(() => {
      if (result.success) { setOpen(false); form.reset(); }
    });
    if (!result.success) toast.error(result.error ?? "Something went wrong");
  });
}
// gate the form on isPending (NOT formState.isSubmitting — the action is inside a transition)
```

The nested `startTransition` after the `await` is required by React — miss it
and the post-await updates fall out of the transition (treated as urgent),
closing the dialog before the revalidated list commits.

Do **not** use plain `useState` per field for new dialogs — that skips
client-side zod and only surfaces errors after a server round-trip.

## Recipe 3: confirmation form (fieldless)

No fields → no RHF. Two transports — `<form action>` + `useActionState` or
`useTransition`. The deciding axis is the **action's argument shape**, NOT where
the trigger sits (an AlertDialog can hold either — `downgrade-button.tsx` uses
`<form action>` inside one). Apply in order:

1. **Public / semi-public surface** (must work pre-hydration — invite accept,
   join-via-link, sign-out) → **`<form action>` + `useActionState`, mandatory**.
   Progressive enhancement for free, and the target is a fixed token/id anyway.
2. **Dropdown / menu item** → **`useTransition`** even if the target is fixed.
   One-way tie-breaker: a `<form>` nested in a `DropdownMenuItem` fights Radix
   focus/close, and a row firing 2–3 actions shouldn't become 2–3 forms.
3. **Otherwise, by argument shape:**
   - Nullary, or a single **fixed** target (hidden input / `.bind` — this
     account, this plan, this token) → **`<form action>` + `useActionState`**.
   - **Dynamic** args the client holds as state (selected row ids, a per-row id
     from a map) → **`useTransition`**.

Errors: toast from either (repo norm). Optimistic UI: `useOptimistic` composes
inside `startTransition`. Neither overrides the rule; a *persistent inline*
error beside the button is the only soft nudge toward `useActionState`.

```tsx
// Fixed target → <form action> + useActionState (accept-button.tsx)
const [state, formAction, pending] = useActionState(acceptInvitationFormAction, null);
// <form action={formAction}><input type="hidden" name="invitationId" value={id} />
//   <button disabled={pending}>Accept</button>{state?.error && <p role="alert">{state.error}</p>}

// Dynamic ids / menu item → useTransition (remove-members-dialog.tsx)
const [isPending, startTransition] = useTransition();
// onClick={() => startTransition(async () => {
//   const r = await removeMembersAction({ ids }); if (!r.success) toast.error(r.error);
// })}
```

Existing confirmations by rule — `<form action>`: delete-account (nullary),
accept-button / join-button (hidden id/token), downgrade-button (bound planId).
`useTransition`: remove/cancel/revoke dialogs (selected ids), sessions-manager,
billing-actions, invitation-actions / invite-link-actions (menu tie-breaker).

## Recipe 4: hybrid public form (public / no-JS surfaces)

For public pages where a visitor may submit before hydration. RHF enhances
after hydration; the native `<form action>` covers the gap. The action takes
`FormData` and returns field errors via `safeParse` (transport 1).

```ts
"use server";
export async function subscribeAction(_prev: unknown, formData: FormData) {
  const parsed = subscribeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  // mutate…
  return { ok: true };
}
```

```tsx
const [state, formAction, pending] = useActionState(subscribeAction, {});
// <form action={formAction}> renders/submits with no JS; RHF (zodResolver) enhances
// the same fields for instant client validation once hydrated. Show state.errors per field.
```

## The server-action contract (non-negotiable in EVERY action)

Rendering the form on a protected page is **not** a security boundary — every
action is a public POST endpoint.

- **Validate** — `schema.parse(input)` (or `safeParse` for field errors)
- **Authenticate + authorize** — `verifySession` / `hasOrgPermission`
- **Ownership from the session, not the payload** — a well-formed input can
  still reference a row the caller doesn't own
- **Return typed `ActionResult<T>`** shaped to what the UI renders (never raw DB
  records); use `toActionError` in the catch
- **`redirect()` throws** — put revalidation calls before it

### Two-tier validation policy

| Form type | Server validation |
|---|---|
| Authenticated (colocated, dialog, molecule) | `schema.parse` + `toActionError` — client zod already gives field errors; a server rejection means an attacker or schema drift, so a generic error is enough |
| Hybrid public form | `schema.safeParse` + field errors via `useActionState` — a pre-hydration submitter has no client validation, so the server response is their only feedback |

## Legacy — do not copy

Five dialogs still use plain `useState` per field (no `zodResolver`). They are
**legacy**; migrate to Recipe 2 when you next touch one:
`invite-member-dialog.tsx`, `bulk-invite-dialog.tsx`, `member-actions.tsx`,
`invite-links-toolbar.tsx` (create-link), and `two-factor-manager.tsx`. The
last also needs its `account/security/actions.ts` actions brought onto the
`ActionResult`/`toActionError` contract (none use `toActionError` in their
catch blocks, and `enable2FAAction` returns a custom shape).

## Gotchas

- Server actions dispatch **sequentially per client** — never `Promise.all`
  multiple actions from the browser; do parallel work inside one action.
- State updates after an `await` inside `startTransition` must be re-wrapped in
  a nested `startTransition` (Recipe 2).
- No barrel imports; async params — see `saasprokit:conventions`.

See `saasprokit:auth` for `verifySession` / `hasOrgPermission`,
`saasprokit:data-access` for file placement, and `reference.md` here for the
rationale and official-docs comparison.
