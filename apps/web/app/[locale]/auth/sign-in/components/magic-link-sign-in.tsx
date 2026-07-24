"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/design-system/components/ui/form";
import { Input } from "@repo/design-system/components/ui/input";
import type { ActionErrorMessages } from "@repo/internationalization";
import Link from "next/link";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { useActionFieldErrors } from "@/hooks/use-action-field-errors";
import { initialFormState } from "@/lib/forms";
import { PAGE_ROUTES } from "@/lib/routes";
import { AuthCard } from "../../components/auth-card";
import { type MagicLinkFormValues, magicLinkSchema } from "../../schemas";
import { signInMagicLinkAction } from "../actions";
import { MagicLinkSentCard } from "./magic-link-sent-card";

interface MagicLinkSignInProps {
  callbackUrl: string;
  errors: ActionErrorMessages;
}

export function MagicLinkSignIn({ callbackUrl, errors }: MagicLinkSignInProps) {
  const [state, formAction, isPending] = useActionState(
    signInMagicLinkAction,
    initialFormState
  );

  const form = useForm<MagicLinkFormValues>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: "" },
  });

  useActionFieldErrors(form, state);

  if (state.status === "success") {
    return <MagicLinkSentCard />;
  }

  const rootError =
    state.status === "error" ? state.error || errors.sendMagicLink : undefined;

  return (
    <AuthCard
      description="We'll send you a link to sign in instantly"
      footer={
        <p className="text-center text-muted-foreground text-sm">
          Don&apos;t have an account?{" "}
          <Link
            className="text-primary hover:underline"
            href={PAGE_ROUTES.SIGN_UP}
          >
            Sign up
          </Link>
        </p>
      }
      title="Magic Link"
    >
      <Form {...form}>
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit((values) =>
            startTransition(() => formAction({ ...values, callbackUrl }))
          )}
        >
          {rootError && (
            <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
              {rootError}
            </div>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="email"
                    disabled={isPending}
                    placeholder="name@example.com"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button className="w-full" disabled={isPending} type="submit">
            {isPending ? "Sending..." : "Send Magic Link"}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
