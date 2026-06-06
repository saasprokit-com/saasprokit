"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/design-system/components/ui/form";
import { Input } from "@repo/design-system/components/ui/input";
import Link from "next/link";
import React from "react";
import { useForm } from "react-hook-form";
import { AuthCard } from "./auth-card";
import { type TwoFactorFormValues, twoFactorSchema } from "./schemas";

export type { TwoFactorFormValues } from "./schemas";

export interface TwoFactorFormProps {
  onSubmit: (data: TwoFactorFormValues) => Promise<void>;
  onResendCode?: () => Promise<void>;
  onUseBackupCode?: () => void;
  signInUrl?: string;
  error?: string;
  method?: "totp" | "otp";
  className?: string;
}

export function TwoFactorForm({
  onSubmit,
  onResendCode,
  onUseBackupCode,
  signInUrl = "/auth/sign-in",
  error,
  method = "totp",
  className,
}: TwoFactorFormProps) {
  const [isResending, setIsResending] = React.useState(false);

  const form = useForm<TwoFactorFormValues>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      code: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function handleSubmit(data: TwoFactorFormValues) {
    try {
      await onSubmit(data);
    } catch (err) {
      form.setError("root", {
        message: err instanceof Error ? err.message : "Invalid code",
      });
    }
  }

  async function handleResendCode() {
    if (!onResendCode || isResending) {
      return;
    }
    setIsResending(true);
    try {
      await onResendCode();
    } finally {
      setIsResending(false);
    }
  }

  const description =
    method === "totp"
      ? "Enter the 6-digit code from your authenticator app"
      : "Enter the 6-digit code sent to your email";

  return (
    <AuthCard
      className={className}
      description={description}
      footer={
        <div className="flex flex-col items-center gap-2">
          {onUseBackupCode && (
            <button
              className="text-muted-foreground text-sm hover:text-primary hover:underline"
              onClick={onUseBackupCode}
              type="button"
            >
              Use a backup code
            </button>
          )}
          <Link
            className="text-muted-foreground text-sm hover:text-primary hover:underline"
            href={signInUrl}
          >
            Back to sign in
          </Link>
        </div>
      }
      title="Two-Factor Authentication"
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
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification Code</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="one-time-code"
                    className="text-center text-2xl tracking-widest"
                    disabled={isSubmitting}
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]*"
                    placeholder="000000"
                    type="text"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                {method === "otp" && onResendCode && (
                  <FormDescription className="text-center">
                    Didn&apos;t receive the code?{" "}
                    <button
                      className="text-primary hover:underline disabled:opacity-50"
                      disabled={isResending}
                      onClick={handleResendCode}
                      type="button"
                    >
                      {isResending ? "Sending..." : "Resend"}
                    </button>
                  </FormDescription>
                )}
              </FormItem>
            )}
          />

          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Verifying..." : "Verify"}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
