import {
  Banner,
  DetailItem,
  DetailsBox,
  EmailButton,
  EmailLayout,
  EmailText,
  FeatureList,
  Heading,
  PlanComparison,
} from "../components";

interface SubscriptionDowngradedProps {
  userName?: string;
  previousPlan?: string;
  newPlan?: string;
  newAmount?: string;
  billingInterval?: string;
  effectiveDate?: string;
  lostFeatures?: string[];
  dashboardUrl?: string;
}

export default function SubscriptionDowngraded({
  userName = "there",
  previousPlan = "Enterprise",
  newPlan = "Pro",
  newAmount = "$19.00",
  billingInterval = "monthly",
  effectiveDate = "January 13, 2025",
  lostFeatures = [
    "Priority support",
    "Advanced analytics",
    "Custom integrations",
  ],
  dashboardUrl = "https://example.com/user",
}: SubscriptionDowngradedProps) {
  return (
    <EmailLayout
      footerContent="If you have any questions about your new plan, our support team is here to help."
      preview={`Your plan has been changed to ${newPlan}`}
    >
      <Banner variant="warning">Plan Changed</Banner>

      <Heading>Your Plan Has Changed</Heading>

      <EmailText>Hi {userName},</EmailText>

      <EmailText>
        Your subscription has been changed from <strong>{previousPlan}</strong>{" "}
        to <strong>{newPlan}</strong>. This change will take effect on{" "}
        {effectiveDate}.
      </EmailText>

      {/* Plan comparison using Outlook-compatible Row/Column layout */}
      <PlanComparison
        isUpgrade={false}
        newPlan={newPlan}
        previousPlan={previousPlan}
      />

      <DetailsBox>
        <DetailItem
          label="New Rate"
          value={`${newAmount}/${billingInterval}`}
        />
        <DetailItem isLast label="Effective Date" value={effectiveDate} />
      </DetailsBox>

      {lostFeatures.length > 0 && (
        <FeatureList
          features={lostFeatures}
          title="Features You'll Lose:"
          variant="error"
        />
      )}

      <EmailText>
        Changed your mind? You can upgrade back to {previousPlan} anytime from
        your dashboard.
      </EmailText>

      <EmailButton href={dashboardUrl}>Manage Subscription</EmailButton>
    </EmailLayout>
  );
}
