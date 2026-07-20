"use client";

import {
  SignInForm,
  type SignInFormValues,
} from "@repo/design-system/components/molecules/auth/sign-in-form";
import type { SocialProvider } from "@repo/design-system/components/molecules/auth/social-providers";
import type { ActionErrorMessages } from "@repo/internationalization";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PAGE_ROUTES } from "@/lib/routes";
import { signInSocialAction } from "../../actions";
import { signInEmailAction } from "../actions";

interface PasswordSignInProps {
  callbackUrl: string;
  errors: ActionErrorMessages;
}

export function PasswordSignIn({ callbackUrl, errors }: PasswordSignInProps) {
  const router = useRouter();

  async function handleSubmit(data: SignInFormValues) {
    const result = await signInEmailAction(data);

    if (!result.success) {
      throw new Error(result.error || errors.signIn);
    }

    if (result.data?.twoFactorRequired) {
      router.push(PAGE_ROUTES.TWO_FACTOR);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  async function handleSocialLogin(provider: SocialProvider) {
    const result = await signInSocialAction(provider, callbackUrl);

    if (result.success && result.data?.url) {
      window.location.href = result.data.url;
      return;
    }

    toast.error(result.error || errors.signIn);
  }

  return (
    <SignInForm
      onSocialLogin={handleSocialLogin}
      onSubmit={handleSubmit}
      socialProviders={["google", "github"]}
    />
  );
}
