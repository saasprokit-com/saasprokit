# Form Handling — rationale

Why the forms system is shaped the way it is, and how our approach compares to
the official React 19 / Next.js 16 guidance. The build recipes and the full
pattern list live in `SKILL.md`; this file is the reasoning behind them.

## Stack

| Concern | Tool |
| --- | --- |
| Form state & submission | `react-hook-form` (`^7.x`) |
| Validation | `zod` (`^4.x`) via `@hookform/resolvers/zod` |
| UI primitives | shadcn-style `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` in `packages/design-system/components/ui/form.tsx` |
| Mutations | Next.js Server Actions returning typed `ActionResult<T>` (`{ success, data }` or `{ success: false, error }`) |
| Notifications | `sonner` toasts |

Forms submit to **Server Actions**, not client fetches to API routes. The one
exception: **auth flows** call the Better Auth client (`signIn.email(...)` from
`@repo/auth/client`), because the Better Auth client owns the cookie/CSRF/social
redirect lifecycle.

## File layout convention

Schemas and actions are colocated with the feature that owns them:

```
app/[locale]/(app)/[orgSlug]/members/
├── schemas.ts     # z.object(...) + inferred types (z.infer<typeof x>)
├── actions.ts     # "use server" actions; re-parse the SAME schema
├── queries.ts     # server-side reads
└── components/    # client form components
```

Each schema file exports both the zod schema and its inferred type. The same
schema validates on the client (via `zodResolver`) **and** on the server (via
`schema.parse()` inside the action) — defense in depth from one definition.

## The patterns

`SKILL.md` names six patterns; the three below are the ones with interesting
mechanics worth explaining. They share a submission target (server actions) and
differ in who owns the form state and where the component lives. Of the other
three, **confirmation form** (fieldless) and **hybrid public form** have their
own recipes in `SKILL.md` (Recipes 3 and 4), and **molecule + Better Auth
client** is a molecule form whose injected handler calls the Better Auth client
— see the molecule form section below.

### colocated form — RHF + zodResolver + server action (the default)

Example: `apps/web/app/[locale]/(app)/account/new-org/components/create-organization-form.tsx`

```tsx
const form = useForm<CreateOrgInput>({
  resolver: zodResolver(createOrgSchema),
  defaultValues: { name: "", slug: "" },
});
const isSubmitting = form.formState.isSubmitting;

async function onSubmit(values: CreateOrgInput) {
  const result = await createOrganizationAction(values);
  if (!result.success) {
    // field-level error or toast
    form.setError("slug", { message: result.error });
    return;
  }
  // navigate / toast
}
```

- Client-side zod validation with instant field-level errors.
- Loading state from `form.formState.isSubmitting`.
- Failures map to `form.setError(...)` (field-level) or a sonner toast.
- The action re-parses the schema, calls `verifySession` / `hasOrgPermission`,
  and returns `ActionResult<T>`.

**Use for:** any multi-field form inside the app.

### molecule form — RHF form as a design-system molecule (dependency-injected)

Example: `packages/design-system/components/molecules/auth/sign-in-form.tsx`,
consumed by `apps/web/app/[locale]/auth/sign-in/components/password-sign-in.tsx`.

Same RHF + zodResolver mechanics as the colocated form — the difference is **who owns the
submit logic**. The molecule takes `onSubmit: (data) => Promise<void>` as a prop,
catches whatever it throws, and surfaces it via `form.setError("root", ...)`. It
knows nothing about server actions, routes, or auth libraries, which is what lets
it live in `packages/design-system`.

The app injects the handler. For auth pages that handler calls the Better Auth
client directly (`signIn.email(...)`) — not a server action — then routes via
`PAGE_ROUTES`.

**Use for:** forms reused across apps, or forms that must stay decoupled from
app-specific transport (the prop is transport-agnostic — an app could pass a
server action to it). When the injected handler calls the Better Auth client
instead of a server action, this is the **molecule + Better Auth client**
pattern — used ONLY by the rate-limited pre-auth flows (sign-in/up, social,
magic-link, OTP, password reset, verify-email, 2FA), which keep Better Auth's
per-route rate limits that a server-side `auth.api.*` call bypasses. Billing is
**not** here — it moved to server actions returning a redirect URL.

### dialog form — RHF + `startTransition`; and the legacy `useState` dialogs

The prescribed **dialog form** keeps RHF + zodResolver for validation and wraps
the action call in `startTransition` (see `SKILL.md` Recipe 2). Five dialogs
predate this rule and use plain `useState` per field — they are **legacy**. This
section explains why the transition matters, using the legacy
`invite-member-dialog.tsx` as the example:

```tsx
const [isPending, startTransition] = useTransition();

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  startTransition(async () => {
    const result = await inviteMemberAction({ organizationId, orgSlug, email, role });
    if (result.success) { toast.success(...); setOpen(false); }
    else { toast.error(...); }
  });
};
```

Manual `useState` per field, no RHF, no client-side zod. Validation happens only
server-side (`inviteMemberSchema.parse()` in the action).

**The `useTransition` part is exactly right** — it's the officially documented
way to invoke a server action outside `<form action>`, and it has a payoff
specific to actions that revalidate: `inviteMemberAction` calls
`revalidateOrgPage(...)`, so the response carries a fresh RSC payload for the
members page. Because the call runs inside a transition:

1. `isPending` spans the **whole** update — server round-trip *plus* the router
   applying the revalidated members list. A manual `setLoading(false)` after
   `await` would drop the spinner before the new row appears.
2. The revalidation re-render is non-blocking; the dialog stays interactive.

**The weakness** of the *legacy* form is the validation UX: users only see real
validation errors after a server round-trip, and it's a second form idiom to
maintain. That's why the current rule is RHF + zodResolver **while keeping**
`startTransition` around the action call — the strongest hybrid, and the
`dialog form` pattern. Migrate legacy `useState` dialogs to it when touched.

One React gotcha in this pattern: state updates *after* the `await` inside
`startTransition` (e.g. `setOpen(false)`) must be re-wrapped in a nested
`startTransition`, or they fall out of the transition and close the dialog
before the revalidated list commits.

## Validation: two layers, one schema

| Layer | Mechanism | Purpose | Trustworthy? |
| --- | --- | --- | --- |
| Client | RHF + `zodResolver(schema)` | UX: instant field errors, fewer wasted round-trips | **No** — skippable (JS disabled, edited bundle, direct POST) |
| Server | `schema.parse(input)` inside the action + `verifySession` / `hasOrgPermission` | Security: the actual boundary | **Yes** — the only layer that counts |

Client-side validation is a convenience, never verification. Anyone can invoke a
server action directly with a crafted request, bypassing RHF entirely. The server
re-parse must exist even though the client already validated — the elegance of
this setup is that both layers cost one schema definition.

### Two-tier server validation

The server re-parse comes in two flavors, chosen by form type:

| Form type | Server validation | Why |
| --- | --- | --- |
| Authenticated (colocated, dialog, molecule) | `schema.parse` + `toActionError` (generic) | client zod already gives field errors; a server rejection means an attacker or schema drift — a generic error is enough |
| Hybrid public form | `schema.safeParse` + field errors via `useActionState` | a pre-hydration submitter has no client validation, so the server response is their only feedback |

## How this compares to the official docs

The canonical React 19 / Next.js pattern is different from ours:

```tsx
// Official: action prop + useActionState, FormData-shaped action
const [state, formAction, pending] = useActionState(createUser, initialState);

<form action={formAction}>
  <input name="email" required type="email" />
  <p aria-live="polite">{state?.message}</p>
  <button disabled={pending}>Sign up</button>
</form>
```

- The action receives `(prevState, formData: FormData)`.
- Works **before hydration and without JS** (progressive enhancement): a native
  form POST still invokes the action.
- Client validation = HTML attributes only; real validation is server-side zod
  `safeParse` returning `{ errors: fieldErrors }`.
- Pending via `useActionState`'s `pending` or `useFormStatus`; optimistic UI via
  `useOptimistic`.

**We deliberately deviate** on the submission layer:

| | Official (`<form action>` + FormData) | Ours (RHF `onSubmit` + typed objects) |
| --- | --- | --- |
| Works pre-hydration / no-JS | ✅ | ❌ form is inert until JS loads |
| Instant field-level validation | ❌ server round-trip per error | ✅ zod on blur/change |
| Type safety | ❌ `formData.get()` is stringly-typed, needs coercion | ✅ `z.infer` types shared end-to-end |
| Typed returns | via `prevState` reducer shape | ✅ `ActionResult<T>` with inference |

The tradeoff is near-free **for authenticated app forms**: sign-in itself
requires JS (Better Auth client), so no-JS users can't reach the dashboard
anyway. The only exposure is the hydration gap.

**When the calculus flips:** public marketing pages, lead-capture, anything
first-visit-critical. There, the hydration gap is exactly when users interact.
We don't switch authoring stacks for it — instead the **hybrid public form**
pattern keeps RHF for the enhanced experience but adds a native
`<form action={serverAction}>` fallback so a pre-hydration submit still POSTs
(with `safeParse` + field errors via `useActionState`). Universal RHF authoring,
gap covered. See `SKILL.md` Recipe 4.

## Server action security checklist

From the Next.js docs: *"Treat every action as an untrusted entry point."* Every
action is a public POST endpoint regardless of where the form renders.

Inside **every** action:

- [ ] **Authenticate & authorize** — `verifySession` / `hasOrgPermission`.
      Rendering the form only on an authenticated page is *not* a security
      boundary.
- [ ] **Validate input** — `schema.parse(input)` (or `safeParse` for field
      errors). Client validation doesn't count.
- [ ] **Send IDs, verify ownership server-side** — schema validation only checks
      *shape*; a well-formed object can still reference a row the caller doesn't
      own. Derive identity from the session, look rows up by ownership
      (e.g. `hasOrgPermission(organizationId, ...)`).
- [ ] **Constrain return values** — returns are serialized to the client; shape
      them to what the UI renders (`ActionResult<T>`), never raw DB records.
- [ ] **Revalidate in the action** — `revalidateOrgPage(...)` /
      `revalidatePath(...)` ships the re-rendered page in the same roundtrip
      (read-your-own-writes, no follow-up fetch).

Operational caveats:

- Server actions dispatch **sequentially per client** — never `Promise.all`
  multiple actions from the browser; parallelize inside a single action instead.
- `redirect()` throws — place revalidation calls *before* it.

## Decision guide

| Situation | Pattern |
| --- | --- |
| Multi-field form in the app | **colocated form** — RHF + zodResolver + server action |
| Form reused across apps / design system | **molecule form** — injected `onSubmit` |
| Rate-limited pre-auth flow (sign-in/up, password reset, OTP, 2FA) | **molecule + Better Auth client** (not a server action — keeps BA's rate limits) |
| Billing (upgrade / portal / cancel) | **server action** returning a Stripe redirect URL |
| Dialog with fields | **dialog form** — RHF + zodResolver + `startTransition` |
| Fieldless confirm / cancel / accept | **confirmation form** — `<form action>`+`useActionState` for a fixed/public target, `useTransition` for dynamic ids / menu items |
| Public / marketing / no-JS-critical form | **hybrid public form** — native `<form action>` fallback + RHF |

(Full decision tree and recipes in `SKILL.md`.)

For a fieldless confirmation, the transport is decided by the action's
**argument shape**, not the trigger's container: a fixed/nullary target
(hidden-input-able, `.bind`) → `<form action>` + `useActionState`; dynamic args
the client holds (selected ids) → `useTransition`; public/semi-public surfaces
mandate `<form action>` (progressive enhancement); dropdown/menu items use
`useTransition` regardless. Proof the container doesn't decide: `downgrade-button.tsx`
uses `<form action>` inside an AlertDialog. See `SKILL.md` Recipe 3 for the
ordered rule.

Notes when touching form code:

1. Authenticated forms use `parse` + `toActionError`; only hybrid public forms
   need `safeParse` + field errors (two-tier policy above).
2. Migrate legacy `useState` dialogs to the **dialog form** pattern (RHF +
   `startTransition`) when touched — the five are listed in `SKILL.md`.

## References

**Official docs**

- [React: `<form>`](https://react.dev/reference/react-dom/components/form)
- [React: `useActionState`](https://react.dev/reference/react/useActionState)
- [Next.js: How to create forms with Server Actions](https://nextjs.org/docs/app/guides/forms)
- [Next.js: Server Actions and Mutations](https://nextjs.org/docs/app/guides/server-actions)

**Repo examples**

- Form primitives: `packages/design-system/components/ui/form.tsx`
- colocated form: `apps/web/app/[locale]/(app)/account/new-org/components/create-organization-form.tsx` (+ `../actions.ts`, `../schemas.ts`)
- molecule form / + Better Auth client: `packages/design-system/components/molecules/auth/sign-in-form.tsx`, `apps/web/app/[locale]/auth/sign-in/components/password-sign-in.tsx`
- confirmation form: `apps/web/app/[locale]/(app)/invite/accept/accept-button.tsx`
- legacy `useState` dialog (do not copy): `apps/web/app/[locale]/(app)/[orgSlug]/members/components/invite-member-dialog.tsx` (+ `../actions.ts` → `inviteMemberAction`)
