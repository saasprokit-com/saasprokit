import { getDictionary } from "@repo/internationalization";
import { ResetPasswordForm } from "./components/reset-password-form";
import { ResetPasswordInvalidLink } from "./components/reset-password-invalid-link";

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

  if (!token) {
    return <ResetPasswordInvalidLink />;
  }

  return <ResetPasswordForm errors={dict.errors.action} token={token} />;
}
