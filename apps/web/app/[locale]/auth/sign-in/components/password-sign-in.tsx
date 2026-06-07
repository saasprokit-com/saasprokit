"use client";

import { signIn } from "@repo/auth/client";
import {
  SignInForm,
  type SignInFormValues,
} from "@repo/design-system/components/molecules/auth/sign-in-form";
import type { SocialProvider } from "@repo/design-system/components/molecules/auth/social-providers";
import type { ActionErrorMessages } from "@repo/internationalization";
import { useRouter } from "next/navigation";
import { PAGE_ROUTES } from "@/lib/routes";

interface PasswordSignInProps {
  errors: ActionErrorMessages;
}

export function PasswordSignIn({ errors }: PasswordSignInProps) {
  const router = useRouter();

  async function handleSubmit(data: SignInFormValues) {
    const normalizedEmail = data.email.toLowerCase().trim();

    const result = await signIn.email({
      email: normalizedEmail,
      password: data.password,
      rememberMe: data.rememberMe,
    });

    if (result.error) {
      throw new Error(result.error.message || errors.signIn);
    }

    router.push(PAGE_ROUTES.ORG);
    router.refresh();
  }

  function handleSocialLogin(provider: SocialProvider) {
    signIn.social({ provider, callbackURL: PAGE_ROUTES.ORG });
  }

  return (
    <SignInForm
      onSocialLogin={handleSocialLogin}
      onSubmit={handleSubmit}
      socialProviders={["google", "github"]}
    />
  );
}
