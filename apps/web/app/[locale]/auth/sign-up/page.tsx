import { getDictionary } from "@repo/internationalization";
import { PasswordSignUp } from "./components/password-sign-up";

interface SignUpPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SignUpPage({ params }: SignUpPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <PasswordSignUp errors={dict.errors.action} />;
}
