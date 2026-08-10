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
  type BackupCodeFormValues,
  backupCodeSchema,
  type TwoFactorFormValues,
  twoFactorSchema,
} from "../../schemas";
import { verifyBackupCodeAction, verifyTwoFactorAction } from "../actions";

interface TwoFactorFormProps {
  errors: ActionErrorMessages;
}

export function TwoFactorForm({ errors }: TwoFactorFormProps) {
  const [usingBackupCode, setUsingBackupCode] = useState(false);

  if (usingBackupCode) {
    return (
      <BackupCodeChallenge
        errors={errors}
        onUseAuthenticator={() => setUsingBackupCode(false)}
      />
    );
  }

  return (
    <TotpChallenge
      errors={errors}
      onUseBackupCode={() => setUsingBackupCode(true)}
    />
  );
}

function ChallengeFooter({
  label,
  onSwitch,
}: {
  label: string;
  onSwitch: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        className="text-muted-foreground text-sm hover:text-primary hover:underline"
        onClick={onSwitch}
        type="button"
      >
        {label}
      </button>
      <Link
        className="text-muted-foreground text-sm hover:text-primary hover:underline"
        href={PAGE_ROUTES.SIGN_IN}
      >
        Back to sign in
      </Link>
    </div>
  );
}

function TotpChallenge({
  errors,
  onUseBackupCode,
}: {
  errors: ActionErrorMessages;
  onUseBackupCode: () => void;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    verifyTwoFactorAction,
    initialFormState
  );

  const form = useForm<TwoFactorFormValues>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: { code: "" },
  });

  useActionFieldErrors(form, state);

  useEffect(() => {
    if (state.status === "success") {
      router.push(PAGE_ROUTES.ORG);
      router.refresh();
    }
  }, [state, router]);

  const rootError =
    state.status === "error"
      ? state.error || errors.invalidVerificationCode
      : undefined;

  return (
    <AuthCard
      description="Enter the 6-digit code from your authenticator app"
      footer={
        <ChallengeFooter
          label="Use a backup code instead"
          onSwitch={onUseBackupCode}
        />
      }
      title="Two-Factor Authentication"
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
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification Code</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="one-time-code"
                    className="text-center text-2xl tracking-widest"
                    disabled={isPending}
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]*"
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
            {isPending ? "Verifying..." : "Verify"}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}

function BackupCodeChallenge({
  errors,
  onUseAuthenticator,
}: {
  errors: ActionErrorMessages;
  onUseAuthenticator: () => void;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    verifyBackupCodeAction,
    initialFormState
  );

  const form = useForm<BackupCodeFormValues>({
    resolver: zodResolver(backupCodeSchema),
    defaultValues: { code: "" },
  });

  useActionFieldErrors(form, state);

  useEffect(() => {
    if (state.status === "success") {
      router.push(PAGE_ROUTES.ORG);
      router.refresh();
    }
  }, [state, router]);

  const rootError =
    state.status === "error" ? state.error || errors.verify2fa : undefined;

  return (
    <AuthCard
      description="Enter one of the backup codes you saved when you set up 2FA"
      footer={
        <ChallengeFooter
          label="Use your authenticator app instead"
          onSwitch={onUseAuthenticator}
        />
      }
      title="Two-Factor Authentication"
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
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Backup Code</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="one-time-code"
                    className="text-center font-mono text-lg tracking-widest"
                    disabled={isPending}
                    placeholder="xxxxx-xxxxx"
                    type="text"
                    {...field}
                  />
                </FormControl>
                <p className="mt-1 text-muted-foreground text-xs">
                  Each backup code works once.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button className="w-full" disabled={isPending} type="submit">
            {isPending ? "Verifying..." : "Verify"}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
