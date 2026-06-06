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
import {
  type SendOtpFormValues,
  sendOtpSchema,
  type VerifyOtpFormValues,
  verifyOtpSchema,
} from "./schemas";

export type { SendOtpFormValues, VerifyOtpFormValues } from "./schemas";

export interface EmailOtpFormProps {
  otpSent: boolean;
  onSendOtp: (data: SendOtpFormValues) => Promise<void>;
  onVerifyOtp: (data: VerifyOtpFormValues) => Promise<void>;
  onUseDifferentEmail: () => void;
  signUpUrl?: string;
  error?: string;
  success?: boolean;
  className?: string;
}

export function EmailOtpForm({
  otpSent,
  onSendOtp,
  onVerifyOtp,
  onUseDifferentEmail,
  signUpUrl = "/auth/sign-up",
  error,
  success = false,
  className,
}: EmailOtpFormProps) {
  const sendForm = useForm<SendOtpFormValues>({
    resolver: zodResolver(sendOtpSchema),
    defaultValues: {
      email: "",
    },
  });

  const verifyForm = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      code: "",
    },
  });

  const isSending = sendForm.formState.isSubmitting;
  const isVerifying = verifyForm.formState.isSubmitting;

  async function handleSend(data: SendOtpFormValues) {
    try {
      await onSendOtp(data);
    } catch (err) {
      sendForm.setError("root", {
        message: err instanceof Error ? err.message : "An error occurred",
      });
    }
  }

  async function handleVerify(data: VerifyOtpFormValues) {
    try {
      await onVerifyOtp(data);
    } catch (err) {
      verifyForm.setError("root", {
        message: err instanceof Error ? err.message : "Invalid code",
      });
    }
  }

  function handleUseDifferentEmail() {
    verifyForm.reset();
    onUseDifferentEmail();
  }

  return (
    <AuthCard
      className={className}
      description={
        otpSent
          ? "Enter the code sent to your email"
          : "We'll send you a one-time code to sign in"
      }
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
      {otpSent ? (
        <Form {...verifyForm}>
          <form
            className="grid gap-4"
            onSubmit={verifyForm.handleSubmit(handleVerify)}
          >
            {(error || verifyForm.formState.errors.root) && (
              <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
                {error || verifyForm.formState.errors.root?.message}
              </div>
            )}

            <FormField
              control={verifyForm.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Code</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="one-time-code"
                      className="text-center font-mono text-lg tracking-widest"
                      disabled={isVerifying}
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

            <Button className="w-full" disabled={isVerifying} type="submit">
              {isVerifying ? "Verifying..." : "Verify & Sign In"}
            </Button>

            <Button
              className="w-full"
              onClick={handleUseDifferentEmail}
              type="button"
              variant="outline"
            >
              Use different email
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...sendForm}>
          <form
            className="grid gap-4"
            onSubmit={sendForm.handleSubmit(handleSend)}
          >
            {(error || sendForm.formState.errors.root) && (
              <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
                {error || sendForm.formState.errors.root?.message}
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-100 p-3 text-green-800 text-sm dark:bg-green-900/30 dark:text-green-400">
                OTP sent to your email!
              </div>
            )}

            <FormField
              control={sendForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="email"
                      disabled={isSending}
                      placeholder="name@example.com"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-full" disabled={isSending} type="submit">
              {isSending ? "Sending..." : "Send Code"}
            </Button>
          </form>
        </Form>
      )}
    </AuthCard>
  );
}
