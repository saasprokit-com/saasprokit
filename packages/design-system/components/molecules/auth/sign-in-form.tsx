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
import Link from "next/link";
import { useForm } from "react-hook-form";
import { AuthCard } from "./auth-card";
import { type SignInFormValues, signInSchema } from "./schemas";
import { type SocialProvider, SocialProviders } from "./social-providers";

export type { SignInFormValues } from "./schemas";

export interface SignInFormProps {
  onSubmit: (data: SignInFormValues) => Promise<void>;
  onSocialLogin?: (provider: SocialProvider) => void;
  socialProviders?: SocialProvider[];
  signUpUrl?: string;
  forgotPasswordUrl?: string;
  error?: string;
  className?: string;
}

export function SignInForm({
  onSubmit,
  onSocialLogin,
  socialProviders = [],
  signUpUrl = "/auth/sign-up",
  forgotPasswordUrl = "/auth/forgot-password",
  error,
  className,
}: SignInFormProps) {
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function handleSubmit(data: SignInFormValues) {
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
      description="Enter your credentials to access your account"
      footer={
        <p className="text-center text-muted-foreground text-sm">
          Don&apos;t have an account?{" "}
          <Link className="text-primary hover:underline" href={signUpUrl}>
            Sign up
          </Link>
        </p>
      }
      title="Sign In"
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    className="text-muted-foreground text-sm hover:text-primary"
                    href={forgotPasswordUrl}
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    autoComplete="current-password"
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal">Remember me</FormLabel>
              </FormItem>
            )}
          />

          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>

          {socialProviders.length > 0 && onSocialLogin && (
            <>
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
                isLoading={isSubmitting}
                onProviderClick={onSocialLogin}
                providers={socialProviders}
              />
            </>
          )}
        </form>
      </Form>
    </AuthCard>
  );
}
