"use client";

import { signIn, signUp } from "@repo/auth/client";
import {
  SignUpForm,
  type SignUpFormValues,
} from "@repo/design-system/components/molecules/auth/sign-up-form";
import type { SocialProvider } from "@repo/design-system/components/molecules/auth/social-providers";
import type { ActionErrorMessages } from "@repo/internationalization";
import { useRouter } from "next/navigation";

interface SignUpClientProps {
  errors: ActionErrorMessages;
}

export function SignUpClient({ errors }: SignUpClientProps) {
  const router = useRouter();

  async function handleSubmit(data: SignUpFormValues) {
    const normalizedEmail = data.email.toLowerCase().trim();

    const result = await signUp.email({
      email: normalizedEmail,
      password: data.password,
      name: data.name,
      callbackURL: "/org",
    });

    if (result.error) {
      throw new Error(result.error.message || errors.signUp);
    }

    router.push(
      `/auth/verify-email?email=${encodeURIComponent(normalizedEmail)}`
    );
  }

  function handleSocialLogin(provider: SocialProvider) {
    signIn.social({ provider, callbackURL: "/org" });
  }

  return (
    <SignUpForm
      onSocialLogin={handleSocialLogin}
      onSubmit={handleSubmit}
      socialProviders={["google", "github"]}
    />
  );
}
