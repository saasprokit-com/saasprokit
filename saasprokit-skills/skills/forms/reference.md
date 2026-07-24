# Form Handling — rationale & framework background

Why the forms system is shaped the way it is, how it compares to the official
React 19 / Next.js guidance, and the framework-level facts (pending semantics,
the five APIs) that drive it. The build recipes and decision tree live in
`SKILL.md`; nothing here repeats them.

## Stack

| Concern | Tool |
| --- | --- |
| Client form state & validation UX | `react-hook-form` (`^7.x`) |
| Validation | `zod` (`^4.x`) via `zodResolver` (client UX) + `safeParse` (server boundary) |
| UI primitives | shadcn `Form`/`FormField`/… in `packages/design-system/components/ui/form.tsx` |
| Submission transport | React 19 `useActionState` — pending signal and returned state both come from the hook |
| Mutations | Server Actions returning `FormState` (form actions) or `ActionResult<T>` (non-form) |
| Notifications | `sonner` toasts (app forms); inline banner (auth pages) |

Schemas and actions are colocated with the feature (`schemas.ts`, `actions.ts`,
`queries.ts`, `components/` per route — including the auth routes; there is no
design-system auth layer). One schema validates on the client via `zodResolver`
**and** on the server via `safeParse` — defense in depth from one definition.
The only non-server-action transport is `fetch()` → Route Handler for file
uploads.

## Why the design is what it is

**Why keep RHF if `useActionState` runs the submit?** They solve different
problems: `useActionState` is the *transport and pending* authority; RHF is the
*client validation and field-state* authority (on-blur errors, focus-on-error,
dirty tracking — UX a bare `<form action>` can't match without a round-trip per
keystroke). Both layers cost one zod schema.

**Why dispatch typed values instead of `FormData`?** `form.handleSubmit` already
produces a typed `z.infer` object; dispatching it keeps types end-to-end (no
`formData.get()` string coercion) and lets non-field values ride along. The
server `safeParse` still guards the boundary — it just parses a typed object.

**Why `startTransition` from the top-level `react` import?** `useActionState`'s
dispatch must run inside a transition, but the `useTransition` hook's `isPending`
is a separate signal we don't use in forms. Dispatching outside a transition
logs a dev error and `isPending` never updates.

**Why client validation never counts:** anyone can invoke a server action
directly with a crafted request, bypassing RHF entirely. The server re-parse
must exist even though the client already validated.

## Pending semantics — why `isSubmitting` is banned

Actions here revalidate (`revalidateOrgPage`/`revalidatePath`) so the response
carries a fresh RSC payload — read-your-own-writes in one roundtrip. The pending
signal must stay true until that fresh UI paints, or the spinner lies:

| Signal | Comes from | Goes `false`… | Covers revalidation re-render? |
| --- | --- | --- | --- |
| `pending` | `useActionState` / `useFormStatus` | when the transition completes | yes (auto-transition) |
| `isPending` | `useTransition` | when *all* transition updates, incl. the router applying the fresh RSC payload, commit | yes |
| `formState.isSubmitting` | react-hook-form | the moment the `onSubmit` promise resolves | **no** — before the fresh UI paints |

Gate on a transition-based signal, never `isSubmitting`. (Inside
`startTransition(async () => …)` `isSubmitting` measures nothing at all —
`startTransition` returns synchronously.)

## How this compares to the official docs

The canonical React 19 / Next.js pattern **is** `useActionState`, and we
converge on it. Recipe B is the official pattern verbatim (`<form action>` +
`FormData` + `.bind`), retaining full progressive enhancement. Recipe A keeps
the hook, the pending signal, and the errors-as-returned-state contract exactly
as documented, with **one intentional twist** — the payload:

| | Official (`<form action>` + FormData) | Recipe A (RHF values → `useActionState`) |
| --- | --- | --- |
| Transport / pending / errors-as-state | `useActionState` | **same hook, same contract** |
| Payload shape | `FormData` — stringly-typed, needs coercion | typed `z.infer` object, ride-alongs welcome |
| Instant field-level validation | ❌ round-trip per error | ✅ zod on blur/change via RHF |
| Works pre-hydration / no-JS | ✅ | ❌ inert until JS loads |

The twist only gives up progressive enhancement, which is near-free behind a
login: reaching a dashboard form already requires JS.

## Hybrid public form (progressive enhancement where it matters)

A public first-visit page (lead capture, invite accept) may be submitted during
the hydration gap. Render the native `<form action>` so a pre-hydration submit
still POSTs, let RHF enhance the same fields after hydration, and have the
action take `FormData` — the pre-hydration submitter has no client validation,
so the server's `fieldErrors` are their only feedback:

```ts
"use server";
export async function subscribeAction(_prev: unknown, formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  // mutate…
  return { ok: true };
}
```

## The five APIs — how / where / when

| API | How | Where | When |
| --- | --- | --- | --- |
| `<form action={fn}>` | server fn receives `FormData`; auto-transition; no `preventDefault` | any real form | fieldless confirms; public forms (PE) |
| `useActionState` | `[state, formAction, pending]`; action gets `(prevState, payload)` | the component owning the `<form>` | you render the action's returned state (errors!) + pending |
| `useFormStatus` | `{ pending } = useFormStatus()` | a **child** inside the `<form>` | reusable submit buttons that shouldn't take a `pending` prop |
| `useOptimistic` | `[optimistic, add] = useOptimistic(real, merge)`; call `add` inside the transition | lists & counters wrapping a mutation | show the change instantly, reconcile on response |
| `useTransition` | `[isPending, startTransition]`; wrap the call; re-wrap post-`await` updates | event handlers outside `<form action>` | menus, onChange, redirects — typed args in, typed result back |

## References

**Official docs**

- [React: `<form>`](https://react.dev/reference/react-dom/components/form)
- [React: `useActionState`](https://react.dev/reference/react/useActionState)
- [Next.js: How to create forms with Server Actions](https://nextjs.org/docs/app/guides/forms)
- [Next.js: Server Actions and Mutations](https://nextjs.org/docs/app/guides/server-actions)

**Repo examples**

- Recipe A: `account/security/components/change-password-form.tsx`; auth variant
  with inline root-error banner: `auth/sign-in/components/sign-in-form.tsx`
- Recipe B: `account/danger/components/delete-account-form.tsx` (nullary),
  `billing/components/downgrade-button.tsx` (bound args, `<form action>` inside
  an AlertDialog — the container never decides the transport),
  `invite/accept/accept-button.tsx` (hidden input)
- Shared plumbing: `@/lib/forms`, `@/hooks/use-action-field-errors`,
  `@/hooks/use-action-result`, `@/lib/auth/action-error`
