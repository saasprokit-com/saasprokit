import { getDictionary } from "@repo/internationalization";
import { ForgotPasswordForm } from "./components/forgot-password-form";

interface ForgotPasswordPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ForgotPasswordPage({
  params,
}: ForgotPasswordPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <ForgotPasswordForm errors={dict.errors.action} />;
}
