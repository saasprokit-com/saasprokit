import { getDictionary } from "@repo/internationalization";
import { SignInClient } from "./sign-in-client";

interface SignInPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SignInPage({ params }: SignInPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <SignInClient errors={dict.errors.action} />;
}
