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
import { z } from "zod";
import { AuthCard } from "./auth-card";

const forgotPasswordSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordFormValues) => Promise<void>;
  signInUrl?: string;
  error?: string;
  success?: boolean;
  className?: string;
}

export function ForgotPasswordForm({
  onSubmit,
  signInUrl = "/auth/sign-in",
  error,
  success = false,
  className,
}: ForgotPasswordFormProps) {
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function handleSubmit(data: ForgotPasswordFormValues) {
    try {
      await onSubmit(data);
    } catch (err) {
      form.setError("root", {
        message: err instanceof Error ? err.message : "An error occurred",
      });
    }
  }

  if (success) {
    return (
      <AuthCard
        className={className}
        description="We've sent you a password reset link"
        footer={
          <Link
            className="text-primary text-sm hover:underline"
            href={signInUrl}
          >
            Back to sign in
          </Link>
        }
        title="Check Your Email"
      >
        <div className="text-center text-muted-foreground text-sm">
          <p>
            If an account exists for the email you entered, you will receive a
            password reset link shortly.
          </p>
          <p className="mt-2">Please check your email inbox and spam folder.</p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      className={className}
      description="Enter your email to receive a password reset link"
      footer={
        <Link className="text-primary text-sm hover:underline" href={signInUrl}>
          Back to sign in
        </Link>
      }
      title="Forgot Password"
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="email"
                    disabled={isSubmitting}
                    placeholder="name@example.com"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
