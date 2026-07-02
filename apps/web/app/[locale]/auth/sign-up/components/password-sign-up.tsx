"use client";

import { signIn, signUp } from "@repo/auth/client";
import type { SignUpFormValues } from "@repo/design-system/components/molecules/auth/schemas";
import { SignUpForm } from "@repo/design-system/components/molecules/auth/sign-up-form";
import type { SocialProvider } from "@repo/design-system/components/molecules/auth/social-providers";
import type { ActionErrorMessages } from "@repo/internationalization";
import { useRouter } from "next/navigation";
import { PAGE_ROUTES } from "@/lib/routes";

interface PasswordSignUpProps {
  errors: ActionErrorMessages;
}

export function PasswordSignUp({ errors }: PasswordSignUpProps) {
  const router = useRouter();

  async function handleSubmit(data: SignUpFormValues) {
    const normalizedEmail = data.email.toLowerCase().trim();

    const result = await signUp.email({
      email: normalizedEmail,
      password: data.password,
      name: data.name,
      callbackURL: PAGE_ROUTES.ORG,
    });

    if (result.error) {
      throw new Error(result.error.message || errors.signUp);
    }

    router.push(
      `${PAGE_ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(normalizedEmail)}`
    );
  }

  function handleSocialLogin(provider: SocialProvider) {
    signIn.social({ provider, callbackURL: PAGE_ROUTES.ORG });
  }

  return (
    <SignUpForm
      onSocialLogin={handleSocialLogin}
      onSubmit={handleSubmit}
      socialProviders={["google", "github"]}
    />
  );
}
