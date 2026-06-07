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
import { type SignUpFormValues, signUpSchema } from "./schemas";
import { type SocialProvider, SocialProviders } from "./social-providers";

export type { SignUpFormValues } from "./schemas";

export interface SignUpFormProps {
  onSubmit: (data: SignUpFormValues) => Promise<void>;
  onSocialLogin?: (provider: SocialProvider) => void;
  socialProviders?: SocialProvider[];
  signInUrl?: string;
  error?: string;
  className?: string;
}

export function SignUpForm({
  onSubmit,
  onSocialLogin,
  socialProviders = [],
  signInUrl = "/auth/sign-in",
  error,
  className,
}: SignUpFormProps) {
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function handleSubmit(data: SignUpFormValues) {
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
      description="Enter your details to create a new account"
      footer={
        <p className="text-center text-muted-foreground text-sm">
          Already have an account?{" "}
          <Link className="text-primary hover:underline" href={signInUrl}>
            Sign in
          </Link>
        </p>
      }
      title="Create Account"
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="name"
                    disabled={isSubmitting}
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="new-password"
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                    placeholder="Confirm your password"
                    type="password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating account..." : "Create Account"}
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
