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
import { type VerifyOtpFormValues, verifyOtpSchema } from "./schemas";

export type { VerifyOtpFormValues } from "./schemas";

export interface EmailOtpVerifyFormProps {
  className?: string;
  error?: string;
  onSubmit: (data: VerifyOtpFormValues) => Promise<void>;
  onUseDifferentEmail: () => void;
  signUpUrl?: string;
}

export function EmailOtpVerifyForm({
  onSubmit,
  onUseDifferentEmail,
  signUpUrl = "/auth/sign-up",
  error,
  className,
}: EmailOtpVerifyFormProps) {
  const form = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      code: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function handleSubmit(data: VerifyOtpFormValues) {
    try {
      await onSubmit(data);
    } catch (err) {
      form.setError("root", {
        message: err instanceof Error ? err.message : "Invalid code",
      });
    }
  }

  return (
    <AuthCard
      className={className}
      description="Enter the code sent to your email"
      footer={
        <p className="text-center text-muted-foreground text-sm">
          Don&apos;t have an account?{" "}
          <Link className="text-primary hover:underline" href={signUpUrl}>
            Sign up
          </Link>
        </p>
      }
      title="Email OTP"
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
                    className="text-center font-mono text-lg tracking-widest"
                    disabled={isSubmitting}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    type="text"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Verifying..." : "Verify & Sign In"}
          </Button>

          <Button
            className="w-full"
            onClick={onUseDifferentEmail}
            type="button"
            variant="outline"
          >
            Use different email
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
