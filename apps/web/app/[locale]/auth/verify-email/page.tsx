import { getDictionary } from "@repo/internationalization";
import { VerifyEmailCard } from "./components/verify-email-card";

interface VerifyEmailPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string }>;
}

export default async function VerifyEmailPage({
  params,
  searchParams,
}: VerifyEmailPageProps) {
  const [{ locale }, { email }] = await Promise.all([params, searchParams]);
  const dict = await getDictionary(locale);

  return <VerifyEmailCard email={email ?? null} errors={dict.errors.action} />;
}
