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
import {
  type ForgotPasswordFormValues,
  forgotPasswordSchema,
} from "../../schemas";
import { requestPasswordResetAction } from "../actions";
import { ForgotPasswordSuccess } from "./forgot-password-success";

interface ForgotPasswordFormProps {
  errors: ActionErrorMessages;
}

export function ForgotPasswordForm({ errors }: ForgotPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(
    requestPasswordResetAction,
    initialFormState
  );

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  useActionFieldErrors(form, state);

  if (state.status === "success") {
    return <ForgotPasswordSuccess />;
  }

  const rootError =
    state.status === "error" ? state.error || errors.sendResetEmail : undefined;

  return (
    <AuthCard
      description="Enter your email to receive a password reset link"
      footer={
        <Link
          className="text-primary text-sm hover:underline"
          href={PAGE_ROUTES.SIGN_IN}
        >
          Back to sign in
        </Link>
      }
      title="Forgot Password"
    >
      <Form {...form}>
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit((values) =>
            startTransition(() => formAction(values))
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
            {isPending ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
