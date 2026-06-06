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
import Link from "next/link";
import { useForm } from "react-hook-form";
import { AuthCard } from "./auth-card";
import { type ResetPasswordFormValues, resetPasswordSchema } from "./schemas";

export type { ResetPasswordFormValues } from "./schemas";

export interface ResetPasswordFormProps {
  onSubmit: (data: ResetPasswordFormValues) => Promise<void>;
  signInUrl?: string;
  error?: string;
  className?: string;
}

export function ResetPasswordForm({
  onSubmit,
  signInUrl = "/auth/sign-in",
  error,
  className,
}: ResetPasswordFormProps) {
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function handleSubmit(data: ResetPasswordFormValues) {
    try {
      await onSubmit(data);
    } catch (err) {
      form.setError("root", {
        message: err instanceof Error ? err.message : "An error occurred",
      });
    }
  }

  return (
    <AuthCard
      className={className}
      description="Enter your new password"
      footer={
        <Link className="text-primary text-sm hover:underline" href={signInUrl}>
          Back to sign in
        </Link>
      }
      title="Reset Password"
    >
      <Form {...form}>
        <form className="grid gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
          {(error || form.formState.errors.root) && (
            <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
              {error || form.formState.errors.root?.message}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                    placeholder="Confirm your password"
                    type="password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
