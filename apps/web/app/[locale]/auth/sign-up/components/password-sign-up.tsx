"use client";

import type { SignUpFormValues } from "@repo/design-system/components/molecules/auth/schemas";
import { SignUpForm } from "@repo/design-system/components/molecules/auth/sign-up-form";
import type { SocialProvider } from "@repo/design-system/components/molecules/auth/social-providers";
import type { ActionErrorMessages } from "@repo/internationalization";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PAGE_ROUTES } from "@/lib/routes";
import { signInSocialAction } from "../../actions";
import { signUpEmailAction } from "../actions";

interface PasswordSignUpProps {
  errors: ActionErrorMessages;
}

export function PasswordSignUp({ errors }: PasswordSignUpProps) {
  const router = useRouter();

  async function handleSubmit(data: SignUpFormValues) {
    const result = await signUpEmailAction(data);

    if (!result.success) {
      throw new Error(result.error || errors.signUp);
    }

    const normalizedEmail = data.email.toLowerCase().trim();
    router.push(
      `${PAGE_ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(normalizedEmail)}`
    );
  }

  async function handleSocialLogin(provider: SocialProvider) {
    const result = await signInSocialAction(provider);

    if (result.success && result.data?.url) {
      window.location.href = result.data.url;
      return;
    }

    toast.error(result.error || errors.signUp);
  }

  return (
    <SignUpForm
      onSocialLogin={handleSocialLogin}
      onSubmit={handleSubmit}
      socialProviders={["google", "github"]}
    />
  );
}
