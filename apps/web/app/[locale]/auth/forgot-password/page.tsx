import { getDictionary } from "@repo/internationalization";
import { ForgotPasswordClient } from "./forgot-password-client";

type ForgotPasswordPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ForgotPasswordPage({
  params,
}: ForgotPasswordPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <ForgotPasswordClient errors={dict.errors.action} />;
}
