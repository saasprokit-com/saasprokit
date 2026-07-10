---
name: forms
description: Form patterns and scaffold recipes for this repo — RHF + zod + server actions, the three form patterns, and step-by-step recipes to create a new form (schema → action → component). Read before creating or modifying any form.
---

# Form Patterns & Scaffold Recipes

Full background and official-docs comparison: `reference.md` in this skill's
directory. This skill is the build recipe.

## Choosing a pattern

| Situation | Pattern |
| --- | --- |
| Multi-field form in the app (default) | **A** — RHF + zodResolver + server action, colocated with the feature |
| Form reused across apps / lives in design system | **B** — molecule with injected `onSubmit: (data) => Promise<void>` prop |
| Auth flows (sign-in/up, social) | **B** + Better Auth client (`signIn.email(...)` from `@repo/auth/client`), NOT a server action |
| Small dialog (1–2 fields) | **A inside a Dialog** with `startTransition` (see recipe 2). Legacy plain-`useState` dialogs exist (Pattern C) — upgrade them when touched |
| Public / no-JS-critical form | Official `<form action>` + `useActionState` + FormData (rare here) |

Canonical examples:
- Pattern A: `apps/web/app/[locale]/(app)/account/new-org/` (schema, action, `components/create-organization-form.tsx`)
- Pattern B: `packages/design-system/components/molecules/auth/sign-in-form.tsx` + `apps/web/app/[locale]/auth/sign-in/components/password-sign-in.tsx`
- Dialog + transition: `apps/web/app/[locale]/(app)/[orgSlug]/members/components/invite-member-dialog.tsx`

## Recipe 1: new form (Pattern A)

Three colocated files under the feature folder (see `saasprokit:data-access` for
where features live, `saasprokit:workflows` for creating the page itself).

### 1. `schemas.ts` — one schema, three jobs

```ts
import { z } from "zod";

export const createThingSchema = z.object({
  name: z.string().min(1).max(100),
  // reuse shared validators where they exist, e.g. slugSchema from @repo/utils/slug
});

export type CreateThingInput = z.infer<typeof createThingSchema>;
```

Export both the schema and the inferred type. The schema powers client
validation, TypeScript types, AND the server-side security check.

### 2. `actions.ts` — the security boundary

```ts
"use server";

import { verifySession } from "@/lib/auth/action-auth";           // personal-scoped
// OR: import { checkOrgPermission } from "...";                  // org-scoped — see saasprokit:auth
import { actionError, toActionError } from "@/lib/auth/action-error";
import type { ActionResult } from "@/lib/auth/auth";
import { type CreateThingInput, createThingSchema } from "./schemas";

export async function createThingAction(
  input: CreateThingInput
): Promise<ActionResult<{ id: string }>> {
  try {
    // 1. Validate — the client check is UX only; this is the real one
    const validated = createThingSchema.parse(input);

    // 2. Authenticate — every action is a public POST endpoint
    const { session, error } = await verifySession<{ id: string }>();
    if (error) return error;

    // 3. Authorize — org-scoped actions: checkOrgPermission(validated.organizationId, {...});
    //    identity comes from the session, never from the input

    // 4. Mutate

    // 5. Revalidate so the response carries the fresh UI (single roundtrip)
    //    org pages: await revalidateOrgPage(validated.orgSlug, ORG_PAGES.X);

    return { success: true, data: { id: thing.id } };
  } catch (error) {
    return toActionError(error, { fallback: "invalidInput" });
  }
}
```

Non-negotiables inside EVERY action (rendering the form on a protected page is
not a security boundary):

- `schema.parse(input)` — validate shape server-side
- `verifySession` / `checkOrgPermission` — authenticate + authorize
- Ownership from the session, not the payload — a well-formed input can still
  reference a row the caller doesn't own
- Return typed `ActionResult<T>` shaped to what the UI renders — never raw DB
  records; use `toActionError` in the catch
- `redirect()` throws — put revalidation calls before it

### 3. `components/create-thing-form.tsx` — the UX layer

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@repo/design-system/components/ui/form";
import { Input } from "@repo/design-system/components/ui/input";
import { Loader2 } from "lucide-react";
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
              <FormControl>
                <Input {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          Create
        </Button>
      </form>
    </Form>
  );
}
```

Conventions: disable inputs with `isSubmitting`; map server errors to
`form.setError("field", ...)` when they belong to a field (see
`create-organization-form.tsx:67-75` for the pattern), sonner toast otherwise.

## Recipe 2: dialog form (RHF + `startTransition`)

Same schema/action files as Recipe 1. In the dialog component, keep RHF for
validation but wrap the action call in a transition — when the action
revalidates, `isPending` then covers the server roundtrip AND the router
applying the fresh page, so the spinner doesn't stop before the table updates:

```tsx
const [isPending, startTransition] = useTransition();
const form = useForm<InviteInput>({ resolver: zodResolver(inviteSchema), ... });

function onSubmit(values: InviteInput) {
  startTransition(async () => {
    const result = await inviteAction(values);
    if (result.success) {
      toast.success("Sent");
      setOpen(false);
      form.reset();
    } else {
      toast.error(result.error ?? "Something went wrong");
    }
  });
}
// disable inputs/buttons with isPending (not formState.isSubmitting)
```

Do not use plain `useState` per field for new dialogs — that skips client-side
zod and gives users errors only after a server round-trip.

## Gotchas

- Server actions dispatch **sequentially per client** — never `Promise.all`
  multiple actions from the browser; do parallel work inside one action.
- Prefer `safeParse` + returned field errors over `parse` + catch when the form
  benefits from per-field server messages.
- No barrel imports; async params — see `saasprokit:conventions`.

See `saasprokit:auth` for `verifySession` / `checkOrgPermission` details,
`saasprokit:data-access` for file placement, and `reference.md` in this skill's
directory for the rationale behind these choices.
