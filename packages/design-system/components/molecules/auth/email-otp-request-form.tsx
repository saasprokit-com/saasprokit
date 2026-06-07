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
import { type SendOtpFormValues, sendOtpSchema } from "./schemas";

export type { SendOtpFormValues } from "./schemas";

export interface EmailOtpRequestFormProps {
  onSubmit: (data: SendOtpFormValues) => Promise<void>;
  signUpUrl?: string;
  error?: string;
  className?: string;
}

export function EmailOtpRequestForm({
  onSubmit,
  signUpUrl = "/auth/sign-up",
  error,
  className,
}: EmailOtpRequestFormProps) {
  const form = useForm<SendOtpFormValues>({
    resolver: zodResolver(sendOtpSchema),
    defaultValues: {
      email: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function handleSubmit(data: SendOtpFormValues) {
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
      description="We'll send you a one-time code to sign in"
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
            {isSubmitting ? "Sending..." : "Send Code"}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
