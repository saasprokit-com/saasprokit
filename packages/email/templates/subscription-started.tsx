import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface SubscriptionStartedProps {
  amount?: string;
  billingInterval?: string;
  dashboardUrl?: string;
  nextBillingDate?: string;
  planName?: string;
  userName?: string;
}

export default function SubscriptionStarted({
  userName = "there",
  planName = "Pro",
  billingInterval = "monthly",
  amount = "$19.00",
  nextBillingDate = "January 13, 2025",
  dashboardUrl = "https://example.com/user",
}: SubscriptionStartedProps) {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>Welcome to {planName} - Your subscription is active!</Preview>
        <Body className="bg-[#f6f9fc] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Ubuntu,sans-serif]">
          <Container className="mx-auto my-0 max-w-[560px] rounded-[8px] bg-white px-[20px] py-[40px]">
            <Section className="mb-[24px] rounded-[8px] bg-[#dcfce7] p-[12px] text-center">
              <Text className="m-0 font-semibold text-[#166534] text-[14px]">
                Subscription Activated
              </Text>
            </Section>

            <Heading
              as="h1"
              className="m-0 mb-[24px] text-center font-bold text-[#1a1a1a] text-[24px] leading-[32px]"
            >
              Welcome to {planName}!
            </Heading>

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              Hi {userName},
            </Text>

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              Thank you for subscribing! Your <strong>{planName}</strong> plan
              is now active, and you have access to all premium features.
            </Text>

            <Section className="my-[24px] rounded-[8px] bg-[#f9fafb] p-[20px]">
              <Text className="m-0 mb-[4px] font-semibold text-[#6b7280] text-[12px] uppercase">
                Plan
              </Text>
              <Text className="m-0 mb-[16px] text-[#1f2937] text-[14px]">
                {planName}
              </Text>

              <Text className="m-0 mb-[4px] font-semibold text-[#6b7280] text-[12px] uppercase">
                Billing
              </Text>
              <Text className="m-0 mb-[16px] text-[#1f2937] text-[14px]">
                {amount}/{billingInterval}
              </Text>

              <Text className="m-0 mb-[4px] font-semibold text-[#6b7280] text-[12px] uppercase">
                Next Billing Date
              </Text>
              <Text className="m-0 mb-[16px] text-[#1f2937] text-[14px]">
                {nextBillingDate}
              </Text>
            </Section>

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              Here's what you can do with your new plan:
            </Text>

            <Section className="my-[24px] rounded-[8px] bg-[#f0f9ff] p-[20px]">
              <Text className="m-0 mb-[8px] pl-[20px] text-[#0369a1] text-[14px]">
                Unlimited articles
              </Text>
              <Text className="m-0 mb-[8px] pl-[20px] text-[#0369a1] text-[14px]">
                Advanced analytics
              </Text>
              <Text className="m-0 mb-[8px] pl-[20px] text-[#0369a1] text-[14px]">
                Priority support
              </Text>
              <Text className="m-0 mb-[8px] pl-[20px] text-[#0369a1] text-[14px]">
                Create organizations
              </Text>
            </Section>

            <Section className="my-[32px] text-center">
              <Button
                className="inline-block rounded-[8px] bg-[#6366f1] px-[32px] py-[12px] text-center font-semibold text-[16px] text-white no-underline"
                href={dashboardUrl}
              >
                Go to Dashboard
              </Button>
            </Section>

            <Hr className="my-[32px] border-[#e6ebf1]" />

            <Text className="m-0 mb-[8px] text-[#8898aa] text-[14px] leading-[22px]">
              You can manage your subscription anytime from your account
              settings.
            </Text>

            <Text className="m-0 mb-[8px] text-[#8898aa] text-[14px] leading-[22px]">
              Thank you for choosing SaaS App!
            </Text>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

SubscriptionStarted.PreviewProps = {
  userName: "there",
  planName: "Pro",
  billingInterval: "monthly",
  amount: "$19.00",
  nextBillingDate: "January 13, 2025",
  dashboardUrl: "https://example.com/user",
} satisfies SubscriptionStartedProps;
