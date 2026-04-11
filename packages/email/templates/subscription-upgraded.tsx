import {
  Banner,
  DetailItem,
  DetailsBox,
  EmailButton,
  EmailLayout,
  EmailText,
  Heading,
  PlanComparison,
} from "../components";

type SubscriptionUpgradedProps = {
  userName?: string;
  previousPlan?: string;
  newPlan?: string;
  newAmount?: string;
  billingInterval?: string;
  effectiveDate?: string;
  dashboardUrl?: string;
};

export default function SubscriptionUpgraded({
  userName = "there",
  previousPlan = "Pro",
  newPlan = "Enterprise",
  newAmount = "$99.00",
  billingInterval = "monthly",
  effectiveDate = "December 13, 2024",
  dashboardUrl = "https://example.com/user",
}: SubscriptionUpgradedProps) {
  return (
    <EmailLayout
      footerContent="Thank you for upgrading! If you have any questions, our support team is here to help."
      preview={`You've upgraded to ${newPlan}!`}
    >
      <Banner variant="success">Upgrade Complete</Banner>

      <Heading>You've Upgraded!</Heading>

      <EmailText>Hi {userName},</EmailText>

      <EmailText>
        Congratulations! You've successfully upgraded from{" "}
        <strong>{previousPlan}</strong> to <strong>{newPlan}</strong>. Your new
        features are now available.
      </EmailText>

      {/* Plan comparison using Outlook-compatible Row/Column layout */}
      <PlanComparison
        isUpgrade={true}
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

      <EmailText>
        Your account has been prorated, so you'll only be charged the difference
        for the current billing period.
      </EmailText>

      <EmailButton href={dashboardUrl}>Explore New Features</EmailButton>
    </EmailLayout>
  );
}
