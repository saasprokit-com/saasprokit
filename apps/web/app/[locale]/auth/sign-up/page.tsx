import { getDictionary } from "@repo/internationalization";
import { SignUpClient } from "./sign-up-client";

interface SignUpPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SignUpPage({ params }: SignUpPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <SignUpClient errors={dict.errors.action} />;
}
