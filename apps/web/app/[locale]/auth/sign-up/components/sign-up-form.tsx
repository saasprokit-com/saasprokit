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
import { type SignUpFormValues, signUpSchema } from "../../schemas";
import { signUpEmailAction } from "../actions";

const SOCIAL_PROVIDERS: SocialProvider[] = ["google", "github"];

interface SignUpFormProps {
  callbackUrl: string;
  errors: ActionErrorMessages;
}

export function SignUpForm({ callbackUrl, errors }: SignUpFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    signUpEmailAction,
    initialFormState
  );

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useActionFieldErrors(form, state);

  useActionResult(state, {
    onSuccess: () => {
      const email = form.getValues("email").toLowerCase().trim();
      router.push(
        `${PAGE_ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(email)}`
      );
    },
  });

  async function handleSocialLogin(provider: SocialProvider) {
    const result = await signInSocialAction(provider, callbackUrl);
    if (result.success && result.data?.url) {
      window.location.href = result.data.url;
      return;
    }
    toast.error(result.error || errors.signUp);
  }

  const rootError =
    state.status === "error" ? state.error || errors.signUp : undefined;

  return (
    <AuthCard
      description="Enter your details to create a new account"
      footer={
        <p className="text-center text-muted-foreground text-sm">
          Already have an account?{" "}
          <Link
            className="text-primary hover:underline"
            href={PAGE_ROUTES.SIGN_IN}
          >
            Sign in
          </Link>
        </p>
      }
      title="Create Account"
    >
      <Form {...form}>
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit((values) =>
            startTransition(() => formAction({ ...values, callbackUrl }))
          )}
        >
          {rootError && (
            <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
              {rootError}
            </div>
          )}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="name"
                    disabled={isPending}
                    placeholder="John Doe"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                <FormLabel>Password</FormLabel>
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
                <FormLabel>Confirm Password</FormLabel>
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
            {isPending ? "Creating account..." : "Create Account"}
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
