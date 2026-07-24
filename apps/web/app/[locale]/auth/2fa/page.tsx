import { getDictionary } from "@repo/internationalization";
import { TwoFactorForm } from "./components/two-factor-form";

interface TwoFactorPageProps {
  params: Promise<{ locale: string }>;
}

export default async function TwoFactorAuthPage({
  params,
}: TwoFactorPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <TwoFactorForm errors={dict.errors.action} />;
}
