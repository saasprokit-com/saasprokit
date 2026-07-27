import type { ActionErrorMessages } from "@repo/internationalization";
import { getActiveSubscription } from "@/lib/billing/subscription-queries";
import { ChangePlanView } from "./change-plan-view";

interface ChangePlanProps {
  errors: ActionErrorMessages;
  locale: string;
  organizationId: string;
  organizationSlug: string;
}

export async function ChangePlan({
  errors,
  locale,
  organizationId,
  organizationSlug,
}: ChangePlanProps) {
  const subscription = await getActiveSubscription({ organizationId });

  return (
    <ChangePlanView
      errors={errors}
      locale={locale}
      organizationId={organizationId}
      organizationSlug={organizationSlug}
      subscription={subscription}
    />
  );
}
