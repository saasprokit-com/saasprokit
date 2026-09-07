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

interface SubscriptionUpgradedProps {
  billingInterval?: string;
  dashboardUrl?: string;
  effectiveDate?: string;
  newAmount?: string;
  newPlan?: string;
  previousPlan?: string;
  userName?: string;
}

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
    <Tailwind>
      <Html>
        <Head>
          <meta content="light" name="color-scheme" />
          <meta content="light" name="supported-color-schemes" />
        </Head>
        <Preview>You've upgraded to {newPlan}!</Preview>
        <Body className="bg-[#f6f9fc] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Ubuntu,sans-serif]">
          <Container className="mx-auto my-0 max-w-[560px] rounded-[8px] bg-white px-[20px] py-[40px]">
            <Section className="mb-[24px] rounded-[8px] bg-[#dcfce7] p-[12px] text-center">
              <Text className="m-0 font-semibold text-[#166534] text-[14px]">
                Upgrade Complete
              </Text>
            </Section>

            <Heading
              as="h1"
              className="m-0 mb-[24px] text-center font-bold text-[#1a1a1a] text-[24px] leading-[32px]"
            >
              You've Upgraded!
            </Heading>

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              Hi {userName},
            </Text>

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              Congratulations! You've successfully upgraded from{" "}
              <strong>{previousPlan}</strong> to <strong>{newPlan}</strong>.
              Your new features are now available.
            </Text>

            <Section className="my-[24px] rounded-[8px] bg-[#f9fafb] p-[20px]">
              <Row>
                <Column className="w-[40%] text-center">
                  <Text className="m-0 mb-[4px] font-semibold text-[#6b7280] text-[12px] uppercase">
                    Previous Plan
                  </Text>
                  <Text className="m-0 font-semibold text-[#1a1a1a] text-[16px]">
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
                  <Text className="m-0 font-bold text-[#1a1a1a] text-[16px]">
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

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              Your account has been prorated, so you'll only be charged the
              difference for the current billing period.
            </Text>

            <Section className="my-[32px] text-center">
              <Button
                className="inline-block rounded-[8px] bg-[#6366f1] px-[32px] py-[12px] text-center font-semibold text-[16px] text-white no-underline"
                href={dashboardUrl}
              >
                Explore New Features
              </Button>
            </Section>

            <Hr className="my-[32px] border-[#e6ebf1]" />
            <Text className="m-0 mb-[8px] text-[#666666] text-[14px] leading-[22px]">
              Thank you for upgrading! If you have any questions, our support
              team is here to help.
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

SubscriptionUpgraded.PreviewProps = {
  userName: "there",
  previousPlan: "Pro",
  newPlan: "Enterprise",
  newAmount: "$99.00",
  billingInterval: "monthly",
  effectiveDate: "December 13, 2024",
  dashboardUrl: "https://example.com/user",
} satisfies SubscriptionUpgradedProps;
