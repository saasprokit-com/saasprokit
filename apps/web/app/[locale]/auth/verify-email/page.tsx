import { SuspenseFallback } from "@repo/design-system/components/ui/suspense-fallback";
import { getDictionary } from "@repo/internationalization";
import { Suspense } from "react";
import { VerifyEmailClient } from "./verify-email-client";

type VerifyEmailPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function VerifyEmailPage({
  params,
}: VerifyEmailPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return (
    <Suspense fallback={<SuspenseFallback className="min-h-screen" />}>
      <VerifyEmailClient errors={dict.errors.action} />
    </Suspense>
  );
}
