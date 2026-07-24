# Form Handling — rationale

Why the forms system is shaped the way it is, and how our approach compares to
the official React 19 / Next.js 16 guidance. The build recipes and the full
decision tree live in `SKILL.md`; this file is the reasoning behind them.

## Stack

| Concern | Tool |
| --- | --- |
| Client form state & validation UX | `react-hook-form` (`^7.x`) — owns field state, dirty/touched, instant errors |
| Validation | `zod` (`^4.x`) via `@hookform/resolvers/zod` (client UX) + `schema.safeParse` (server boundary) |
| UI primitives | shadcn-style `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` in `packages/design-system/components/ui/form.tsx` |
| Submission transport | React 19 `useActionState` — the pending signal (`isPending`) and the returned state both come from the hook |
| Mutations | Next.js Server Actions returning `FormState<TValues, TData>` (form actions) or typed `ActionResult<T>` (non-form server functions) |
| Notifications | `sonner` toasts (app forms); inline banner (auth pages) |

Forms submit to **Server Actions**, not client fetches to API routes — including
all **auth flows** (sign-in/up, social, magic-link, OTP, forgot/reset password,
verify-email, 2FA, change-password), which call `auth.api.*` inside server
actions. Because `auth.api.*` bypasses Better Auth's HTTP-path rate limiter,
those actions re-apply brute-force protection server-side via `enforceRateLimit`
(`apps/web/lib/auth/rate-limit.ts`). The one exception is **`fetch()` → Route
Handler** for file uploads.

## File layout convention

Schemas and actions are colocated with the feature that owns them:

```
app/[locale]/(app)/[orgSlug]/members/
├── schemas.ts     # z.object(...) + inferred types (z.infer<typeof x>)
├── actions.ts     # "use server" actions; re-validate the SAME schema
├── queries.ts     # server-side reads
└── components/    # client form components
```

Each schema file exports both the zod schema and its inferred type. The same
schema validates on the client (via `zodResolver`) **and** on the server (via
`schema.safeParse(input)` inside the action) — defense in depth from one
definition.

Auth forms follow the same convention rather than living in the design system:
they are **colocated** with their route under
`apps/web/app/[locale]/auth/*/components/`, with the shared `AuthCard` and
`SocialProviders` in `apps/web/app/[locale]/auth/components/` and their schemas
in `apps/web/app/[locale]/auth/schemas.ts`. There is no design-system auth
molecule layer.

## The two recipes

Every form in the repo is one of two recipes, and both route submission through
React 19 `useActionState` and gate on the hook's own `isPending`. They differ
only in whether there are input fields to validate.

### Recipe A — field-form (anything with typed inputs)

RHF + `zodResolver` still own the **client** experience — instant field-level
errors, dirty/touched tracking, focus management. Submission, however, is
dispatched through `useActionState`:

```tsx
const [state, formAction, isPending] = useActionState(action, initialFormState);
const form = useForm<Values>({ resolver: zodResolver(schema) });

useActionFieldErrors(form, state);   // server fieldErrors → RHF fields

// <form onSubmit={form.handleSubmit((values) =>
//   startTransition(() => formAction(values))   // startTransition: top-level react import
// )}>
// gate every input + the submit button on isPending
```

The action has signature `(prevState, input)`, re-validates with
`schema.safeParse`, and **returns** errors as state — it never throws:

```ts
"use server";
export async function action(
  _prev: FormState<Values, Data>,
  input: Values
): Promise<FormState<Values, Data>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  try {
    // authorize, mutate, revalidate
    return { status: "success", data };
  } catch (error) {
    return toFormError(error, { fallback: "…", logger });   // { status: "error", error }
  }
}
```

**Why keep RHF at all if `useActionState` runs the submit?** Because the two
solve different problems. `useActionState` is the *transport and pending*
authority; RHF is the *client validation and field-state* authority. Dropping
RHF would cost instant on-blur validation, focus-on-error, and dirty tracking —
UX that a bare `<form action>` can't replicate without a server round-trip per
keystroke. Keeping both costs nothing extra: the one zod schema feeds
`zodResolver` on the client and `safeParse` on the server.

**Why dispatch typed values instead of `FormData`?** `form.handleSubmit` already
produces a fully-typed `z.infer<typeof schema>` object; dispatching it preserves
end-to-end types (no `formData.get()` string coercion) and lets non-field values
(an `organizationId`, a `token`) ride along in the same typed object. The
`safeParse` on the server still guards the boundary — it just parses a typed
object instead of a stringly-typed `FormData`.

**Why `startTransition` from the top-level `react` import?** `useActionState`'s
dispatch must run inside a transition, but it is **not** the `useTransition`
hook — the hook's `isPending` is a separate signal we don't use here.
Dispatching outside a transition logs a dev error and `isPending` never updates.
So we wrap `form.handleSubmit`'s callback in the module-level `startTransition`.

### Recipe B — confirm-button (no input fields)

No fields → no RHF, no client validation to preserve. This is the canonical
official pattern verbatim: `<form action={formAction}>` + `useActionState`, with
dynamic args supplied via `.bind(null, args)`. React auto-wraps the `action`
prop in a transition, so there is no manual `startTransition`. Gate on
`isPending` from the hook.

```tsx
const boundAction = removeThingsFormAction.bind(null, { ids });
const [state, formAction, isPending] = useActionState(boundAction, null);
// <form action={formAction}><Button disabled={isPending} type="submit">…</Button></form>
```

A type-to-confirm guard input (e.g. "type the org name to delete") stays plain
`useState` gating `disabled` — it is not submitted and not RHF.

### Why `isPending` from the hook, never `isSubmitting`

This is the single rule the whole system enforces. Actions here **revalidate**
(`revalidateOrgPage(...)` / `revalidatePath(...)`) so the response carries a
fresh RSC payload — read-your-own-writes in one roundtrip. The pending signal has
to stay true until that fresh UI paints, or the spinner lies:

- `isPending` from `useActionState` stays true until the action **and** the
  revalidation re-render have both committed. The spinner stops when the new UI
  is on screen.
- `form.formState.isSubmitting` goes false the moment the action's promise
  resolves — **before** the router applies the revalidated payload. Gate on it
  and the button re-enables over stale UI for a frame. That's the "lying
  spinner", and it's why `isSubmitting` (and `useFormStatus`) are banned for
  form submission here.

## When it is NOT a form: `useTransition`

`useTransition` is not gone — it moved. It is now used **only** for interactions
that call a server action but are not a submitted `<form>`, where its
transition-scoped `isPending` still spans the revalidation:

- **Dropdown / menu items** — a nested `<form>` fights Radix focus/close, and a
  row firing 2–3 actions shouldn't become 2–3 forms.
- **Select `onChange`** that mutates immediately (e.g. a role selector).
- **Buttons that redirect** to Stripe / an OAuth URL, or refresh the router.
- **File uploads** — `fetch()` → Route Handler, the one non-server-action
  transport.

Its one gotcha: a state update *after* an `await` inside `startTransition` must
be re-wrapped in a nested `startTransition`, or it falls out of the transition.
Field-forms avoid this entirely because `useActionState` owns the transition.

## Validation: two layers, one schema

| Layer | Mechanism | Purpose | Trustworthy? |
| --- | --- | --- | --- |
| Client | RHF + `zodResolver(schema)` | UX: instant field errors, fewer wasted round-trips | **No** — skippable (JS disabled, edited bundle, direct POST) |
| Server | `schema.safeParse(input)` inside the action + `verifySession` / `hasOrgPermission` | Security: the actual boundary | **Yes** — the only layer that counts |

Client-side validation is a convenience, never verification. Anyone can invoke a
server action directly with a crafted request, bypassing RHF entirely. The server
re-parse must exist even though the client already validated — the elegance of
this setup is that both layers cost one schema definition.

Every form action now `safeParse`s and returns `fieldErrors` as state (surfaced
onto RHF fields via `useActionFieldErrors`). There is no longer a two-tier split
where authenticated forms used `parse` + a generic error and only public forms
used `safeParse` + field errors — the whole codebase returns field errors from
the action uniformly, so schema drift or a partial-payload attack produces the
same precise, field-anchored feedback everywhere.

## How this compares to the official docs

The canonical React 19 / Next.js pattern **is** `useActionState`, and we now
**converge** on it — earlier this doc described a deliberate deviation
(RHF `onSubmit` + a direct `await`); that is gone.

```tsx
// Official: action prop + useActionState
const [state, formAction, pending] = useActionState(createUser, initialState);

<form action={formAction}>
  <input name="email" required type="email" />
  <p aria-live="polite">{state?.error}</p>
  <button disabled={pending}>Sign up</button>
</form>
```

We keep the hook, the pending signal, and the errors-as-returned-state contract
exactly as documented. The **one intentional twist** is the payload: instead of
letting the action receive a stringly-typed `FormData`, a field-form dispatches
the typed RHF values object.

| | Official (`<form action>` + FormData) | Ours — Recipe A (RHF values → `useActionState`) |
| --- | --- | --- |
| Submission transport | `useActionState`, action gets `(prevState, formData)` | `useActionState`, action gets `(prevState, values)` — **same hook** |
| Pending signal | `pending` from the hook | `isPending` from the hook — **same** |
| Errors returned as state | ✅ | ✅ **same** (`FormState`) |
| Payload shape | `FormData` — `formData.get()` is stringly-typed, needs coercion | typed `z.infer` values object, non-field data rides along |
| Instant field-level validation | ❌ server round-trip per error | ✅ zod on blur/change via RHF |
| Works pre-hydration / no-JS | ✅ | ❌ inert until JS loads |

The only thing the twist gives up is progressive enhancement, and that's
near-free for authenticated app forms: reaching a dashboard form already requires
JS, so a no-JS visitor was never going to submit it. **Recipe B keeps the
official `FormData` shape verbatim** (fieldless confirms, `.bind` args), so it
retains full progressive enhancement where it's cheap to keep.

## Server action security checklist

From the Next.js docs: *"Treat every action as an untrusted entry point."* Every
action is a public POST endpoint regardless of where the form renders.

Inside **every** action:

- [ ] **Authenticate & authorize** — `verifySession` / `hasOrgPermission`.
      Rendering the form only on an authenticated page is *not* a security
      boundary.
- [ ] **Validate input** — `schema.safeParse(input)`; return `fieldErrors` via
      `fieldErrorsFrom(parsed.error)` on failure. Client validation doesn't count.
- [ ] **Send IDs, verify ownership server-side** — schema validation only checks
      *shape*; a well-formed object can still reference a row the caller doesn't
      own. Derive identity from the session, look rows up by ownership
      (e.g. `hasOrgPermission(organizationId, ...)`).
- [ ] **Constrain return values** — returns are serialized to the client; shape
      them to what the UI renders (`FormState` for form actions, typed
      `ActionResult<T>` for non-form server functions), never raw DB records.
- [ ] **Revalidate in the action** — `revalidateOrgPage(...)` /
      `revalidatePath(...)` ships the re-rendered page in the same roundtrip
      (read-your-own-writes, no follow-up fetch).

Operational caveats:

- Server actions dispatch **sequentially per client** — never `Promise.all`
  multiple actions from the browser; parallelize inside a single action instead.
- `redirect()` throws — place revalidation calls *before* it.
- Failures are **returned as `FormState`** (`toFormError` / `formActionError`),
  never thrown out of a form action.

## Decision guide

| Situation | Recipe |
| --- | --- |
| Form with typed input fields (create org, sign-in, change password, invite) | **Recipe A — field-form**: RHF + `zodResolver` for client UX, submit via `form.handleSubmit((values) => startTransition(() => formAction(values)))`, gate on `isPending` |
| Fieldless confirm / delete / accept / resend | **Recipe B — confirm-button**: `<form action={formAction}>` + `useActionState`, args via `.bind(null, args)`, gate on `isPending` |
| Not a submitted `<form>` — menu item, `select onChange`, a button that redirects (Stripe/OAuth) or refreshes, or a file upload | **`useTransition`** — the non-form escape hatch (last section) |

For a fieldless confirmation, the transport is decided by the action's
**argument shape**, not the trigger's container: a fixed/nullary target
(hidden-input-able, `.bind`) → Recipe B; dynamic args the client holds (selected
ids) or a dropdown/menu item → `useTransition`. Proof the container doesn't
decide: `downgrade-button.tsx` uses `<form action>` inside an AlertDialog.

(Full decision tree and step-by-step scaffolds in `SKILL.md`.)

## References

**Official docs**

- [React: `<form>`](https://react.dev/reference/react-dom/components/form)
- [React: `useActionState`](https://react.dev/reference/react/useActionState)
- [Next.js: How to create forms with Server Actions](https://nextjs.org/docs/app/guides/forms)
- [Next.js: Server Actions and Mutations](https://nextjs.org/docs/app/guides/server-actions)

**Repo examples**

- Form primitives: `packages/design-system/components/ui/form.tsx`
- Recipe A — field-form: `apps/web/app/[locale]/(app)/account/security/components/change-password-form.tsx` (+ `../actions.ts` → `changePasswordAction`, `../schemas.ts`); auth variant with inline root-error banner: `apps/web/app/[locale]/auth/sign-in/components/sign-in-form.tsx`
- Recipe B — confirm-button: `apps/web/app/[locale]/(app)/account/danger/components/delete-account-form.tsx` (nullary) and `apps/web/app/[locale]/(app)/[orgSlug]/billing/components/downgrade-button.tsx` (bound args); with a hidden input: `apps/web/app/[locale]/(app)/invite/accept/accept-button.tsx`
- Shared plumbing: `@/lib/forms` (`FormState`, `initialFormState`, `fieldErrorsFrom`), `@/hooks/use-action-field-errors` (`useActionFieldErrors`), `@/lib/auth/action-error` (`toFormError`, `formActionError`)
