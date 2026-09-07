import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface SubscriptionDowngradedProps {
  billingInterval?: string;
  dashboardUrl?: string;
  effectiveDate?: string;
  lostFeatures?: string[];
  newAmount?: string;
  newPlan?: string;
  previousPlan?: string;
  userName?: string;
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
    <Tailwind>
      <Html>
        <Head>
          <meta content="light" name="color-scheme" />
          <meta content="light" name="supported-color-schemes" />
        </Head>
        <Preview>Your plan has been changed to {newPlan}</Preview>
        <Body className="bg-[#f6f9fc] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Ubuntu,sans-serif]">
          <Container className="mx-auto my-0 max-w-[560px] rounded-[8px] bg-white px-[20px] py-[40px]">
            <Section className="mb-[24px] rounded-[8px] bg-[#fef3c7] p-[12px] text-center">
              <Text className="m-0 font-semibold text-[#92400e] text-[14px]">
                Plan Changed
              </Text>
            </Section>

            <Heading
              as="h1"
              className="m-0 mb-[24px] text-center font-bold text-[#1a1a1a] text-[24px] leading-[32px]"
            >
              Your Plan Has Changed
            </Heading>

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              Hi {userName},
            </Text>

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              Your subscription has been changed from{" "}
              <strong>{previousPlan}</strong> to <strong>{newPlan}</strong>.
              This change will take effect on {effectiveDate}.
            </Text>

            <Section className="my-[24px] rounded-[8px] bg-[#f9fafb] p-[20px]">
              <Row>
                <Column className="w-[40%] text-center">
                  <Text className="m-0 mb-[4px] font-semibold text-[#6b7280] text-[12px] uppercase">
                    Previous Plan
                  </Text>
                  <Text className="m-0 text-[#6b7280] text-[16px] line-through">
                    {previousPlan}
                  </Text>
                </Column>
                <Column className="w-[20%] text-center align-middle">
                  <Text className="m-0 text-[#9ca3af] text-[24px]">→</Text>
                </Column>
                <Column className="w-[40%] text-center">
                  <Text className="m-0 mb-[4px] font-semibold text-[#6b7280] text-[12px] uppercase">
                    New Plan
                  </Text>
                  <Text className="m-0 font-semibold text-[#1a1a1a] text-[16px]">
                    {newPlan}
                  </Text>
                </Column>
              </Row>
            </Section>

            <Section className="my-[24px] rounded-[8px] bg-[#f9fafb] p-[20px]">
              <Text className="m-0 mb-[4px] font-semibold text-[#6b7280] text-[12px] uppercase">
                New Rate
              </Text>
              <Text className="m-0 mb-[16px] text-[#1a1a1a] text-[14px]">
                {newAmount}/{billingInterval}
              </Text>

              <Text className="m-0 mb-[4px] font-semibold text-[#6b7280] text-[12px] uppercase">
                Effective Date
              </Text>
              <Text className="m-0 text-[#1a1a1a] text-[14px]">
                {effectiveDate}
              </Text>
            </Section>

            {lostFeatures.length > 0 && (
              <Section className="my-[24px] rounded-[8px] bg-[#fef2f2] p-[16px]">
                <Text className="m-0 mb-[8px] font-semibold text-[#991b1b] text-[14px]">
                  Features You'll Lose:
                </Text>
                {lostFeatures.map((feature) => (
                  <Text
                    className="m-0 mb-[4px] text-[#dc2626] text-[14px]"
                    key={feature}
                  >
                    • {feature}
                  </Text>
                ))}
              </Section>
            )}

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              Changed your mind? You can upgrade back to {previousPlan} anytime
              from your dashboard.
            </Text>

            <Section className="my-[32px] text-center">
              <Button
                className="inline-block rounded-[8px] bg-[#6366f1] px-[32px] py-[12px] text-center font-semibold text-[16px] text-white no-underline"
                href={dashboardUrl}
              >
                Manage Subscription
              </Button>
            </Section>

            <Hr className="my-[32px] border-[#e6ebf1]" />
            <Text className="m-0 mb-[8px] text-[#666666] text-[14px] leading-[22px]">
              If you have any questions about your new plan, our support team is
              here to help.
            </Text>
            <Text className="m-0 mb-[8px] text-[#666666] text-[14px] leading-[22px]">
              This email was sent by SaaS App. If you have any questions, please
              contact our support team.
            </Text>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

SubscriptionDowngraded.PreviewProps = {
  userName: "there",
  previousPlan: "Enterprise",
  newPlan: "Pro",
  newAmount: "$19.00",
  billingInterval: "monthly",
  effectiveDate: "January 13, 2025",
  lostFeatures: [
    "Priority support",
    "Advanced analytics",
    "Custom integrations",
  ],
  dashboardUrl: "https://example.com/user",
} satisfies SubscriptionDowngradedProps;
