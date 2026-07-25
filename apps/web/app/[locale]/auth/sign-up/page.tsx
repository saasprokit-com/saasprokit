import { getDictionary } from "@repo/internationalization";
import { resolveCallbackUrl } from "@/lib/routes";
import { SignUpForm } from "./components/sign-up-form";

interface SignUpPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function SignUpPage({
  params,
  searchParams,
}: SignUpPageProps) {
  const [{ locale }, { callbackUrl: rawCallbackUrl }] = await Promise.all([
    params,
    searchParams,
  ]);
  const dict = await getDictionary(locale);
  const callbackUrl = resolveCallbackUrl(rawCallbackUrl);

  return <SignUpForm callbackUrl={callbackUrl} errors={dict.errors.action} />;
}
