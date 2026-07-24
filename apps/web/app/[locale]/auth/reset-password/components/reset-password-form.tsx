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
  type ResetPasswordFormValues,
  resetPasswordSchema,
} from "../../schemas";
import { resetPasswordAction } from "../actions";
import { ResetPasswordSuccess } from "./reset-password-success";

interface ResetPasswordFormProps {
  errors: ActionErrorMessages;
  token: string;
}

export function ResetPasswordForm({ errors, token }: ResetPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    initialFormState
  );

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useActionFieldErrors(form, state);

  if (state.status === "success") {
    return <ResetPasswordSuccess />;
  }

  const rootError =
    state.status === "error" ? state.error || errors.resetPassword : undefined;

  return (
    <AuthCard
      description="Enter your new password"
      footer={
        <Link
          className="text-primary text-sm hover:underline"
          href={PAGE_ROUTES.SIGN_IN}
        >
          Back to sign in
        </Link>
      }
      title="Reset Password"
    >
      <Form {...form}>
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit((values) =>
            startTransition(() => formAction({ ...values, token }))
          )}
        >
          {rootError && (
            <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
              {rootError}
            </div>
          )}

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="new-password"
                    disabled={isPending}
                    placeholder="Create a strong password"
                    type="password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="new-password"
                    disabled={isPending}
                    placeholder="Confirm your password"
                    type="password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button className="w-full" disabled={isPending} type="submit">
            {isPending ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
