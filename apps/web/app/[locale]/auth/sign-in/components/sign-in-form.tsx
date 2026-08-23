"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/design-system/components/ui/button";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
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
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useActionFieldErrors } from "@/hooks/use-action-field-errors";
import { useActionResult } from "@/hooks/use-action-result";
import { initialFormState } from "@/lib/forms";
import { PAGE_ROUTES } from "@/lib/routes";
import { signInSocialAction } from "../../actions";
import { AuthCard } from "../../components/auth-card";
import {
  type SocialProvider,
  SocialProviders,
} from "../../components/social-providers";
import { type SignInFormValues, signInSchema } from "../../schemas";
import { signInEmailAction } from "../actions";

const SOCIAL_PROVIDERS: SocialProvider[] = ["google", "github"];

interface SignInFormProps {
  callbackUrl: string;
  errors: ActionErrorMessages;
}

export function SignInForm({ callbackUrl, errors }: SignInFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    signInEmailAction,
    initialFormState
  );

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  useActionFieldErrors(form, state);

  useActionResult(state, {
    onSuccess: (data) => {
      if (data?.twoFactorRequired) {
        router.push(PAGE_ROUTES.TWO_FACTOR);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    },
  });

  async function handleSocialLogin(provider: SocialProvider) {
    const result = await signInSocialAction(provider, callbackUrl);
    if (result.success && result.data?.url) {
      window.location.href = result.data.url;
      return;
    }
    toast.error(result.error || errors.signIn);
  }

  const rootError = state.status === "error" ? state.error : undefined;

  return (
    <AuthCard
      description="Enter your credentials to access your account"
      footer={
        <p className="text-center text-muted-foreground text-sm">
          Don&apos;t have an account?{" "}
          <Link
            className="text-primary hover:underline"
            href={PAGE_ROUTES.SIGN_UP}
          >
            Sign up
          </Link>
        </p>
      }
      title="Sign In"
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    className="text-muted-foreground text-sm hover:text-primary"
                    href={PAGE_ROUTES.FORGOT_PASSWORD}
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    autoComplete="current-password"
                    disabled={isPending}
                    placeholder="Enter your password"
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
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    disabled={isPending}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal">Remember me</FormLabel>
              </FormItem>
            )}
          />

          <Button className="w-full" disabled={isPending} type="submit">
            {isPending ? "Signing in..." : "Sign In"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <SocialProviders
            isLoading={isPending}
            onProviderClick={handleSocialLogin}
            providers={SOCIAL_PROVIDERS}
          />
        </form>
      </Form>
    </AuthCard>
  );
}
