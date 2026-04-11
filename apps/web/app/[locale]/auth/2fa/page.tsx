import { getDictionary } from "@repo/internationalization";
import { TwoFactorClient } from "./two-factor-client";

type TwoFactorPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function TwoFactorAuthPage({
  params,
}: TwoFactorPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <TwoFactorClient errors={dict.errors.action} />;
}
