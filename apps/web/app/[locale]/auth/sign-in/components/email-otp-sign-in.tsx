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
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useActionFieldErrors } from "@/hooks/use-action-field-errors";
import { initialFormState } from "@/lib/forms";
import { PAGE_ROUTES } from "@/lib/routes";
import { AuthCard } from "../../components/auth-card";
import {
  type SendOtpFormValues,
  sendOtpSchema,
  type VerifyOtpFormValues,
  verifyOtpSchema,
} from "../../schemas";
import { sendSignInOtpAction, verifySignInOtpAction } from "../actions";

interface EmailOtpSignInProps {
  callbackUrl: string;
  errors: ActionErrorMessages;
}

export function EmailOtpSignIn({ callbackUrl, errors }: EmailOtpSignInProps) {
  const [email, setEmail] = useState("");

  if (email) {
    return (
      <EmailOtpVerify
        callbackUrl={callbackUrl}
        email={email}
        errors={errors}
        onUseDifferentEmail={() => setEmail("")}
      />
    );
  }

  return <EmailOtpRequest errors={errors} onSent={setEmail} />;
}

function SignUpFooter() {
  return (
    <p className="text-center text-muted-foreground text-sm">
      Don&apos;t have an account?{" "}
      <Link className="text-primary hover:underline" href={PAGE_ROUTES.SIGN_UP}>
        Sign up
      </Link>
    </p>
  );
}

function EmailOtpRequest({
  errors,
  onSent,
}: {
  errors: ActionErrorMessages;
  onSent: (email: string) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    sendSignInOtpAction,
    initialFormState
  );

  const form = useForm<SendOtpFormValues>({
    resolver: zodResolver(sendOtpSchema),
    defaultValues: { email: "" },
  });

  useActionFieldErrors(form, state);

  useEffect(() => {
    if (state.status === "success") {
      onSent(form.getValues("email").toLowerCase().trim());
    }
  }, [state, form, onSent]);

  const rootError =
    state.status === "error" ? state.error || errors.sendOtp : undefined;

  return (
    <AuthCard
      description="We'll send you a one-time code to sign in"
      footer={<SignUpFooter />}
      title="Email OTP"
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
            {isPending ? "Sending..." : "Send Code"}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}

function EmailOtpVerify({
  callbackUrl,
  email,
  errors,
  onUseDifferentEmail,
}: {
  callbackUrl: string;
  email: string;
  errors: ActionErrorMessages;
  onUseDifferentEmail: () => void;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    verifySignInOtpAction,
    initialFormState
  );

  const form = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { code: "" },
  });

  useActionFieldErrors(form, state);

  useEffect(() => {
    if (state.status === "success") {
      router.push(callbackUrl);
      router.refresh();
    }
  }, [state, router, callbackUrl]);

  const rootError =
    state.status === "error" ? state.error || errors.invalidOtp : undefined;

  return (
    <AuthCard
      description="Enter the code sent to your email"
      footer={<SignUpFooter />}
      title="Email OTP"
    >
      <Form {...form}>
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit((values) =>
            startTransition(() => formAction({ ...values, email }))
          )}
        >
          {rootError && (
            <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
              {rootError}
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
                    disabled={isPending}
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

          <Button className="w-full" disabled={isPending} type="submit">
            {isPending ? "Verifying..." : "Verify & Sign In"}
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
