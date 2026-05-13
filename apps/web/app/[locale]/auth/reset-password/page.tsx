import { getDictionary } from "@repo/internationalization";
import { ResetPasswordClient } from "./reset-password-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: PageProps) {
  const [{ locale }, { token }] = await Promise.all([params, searchParams]);
  const dict = await getDictionary(locale);
  return <ResetPasswordClient errors={dict.errors.action} token={token} />;
}
