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

interface SubscriptionCancelledProps {
  accessUntil?: string;
  cancellationReason?: string;
  feedbackUrl?: string;
  planName?: string;
  reactivateUrl?: string;
  userName?: string;
}

export default function SubscriptionCancelled({
  userName = "there",
  planName = "Pro",
  accessUntil = "January 13, 2025",
  cancellationReason = "User requested",
  reactivateUrl = "https://example.com/pricing",
  feedbackUrl = "https://example.com/feedback",
}: SubscriptionCancelledProps) {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>Your {planName} subscription has been cancelled</Preview>
        <Body className="bg-[#f6f9fc] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Ubuntu,sans-serif]">
          <Container className="mx-auto my-0 max-w-[560px] rounded-[8px] bg-white px-[20px] py-[40px]">
            <Section className="mb-[24px] rounded-[8px] bg-[#f3f4f6] p-[12px] text-center">
              <Text className="m-0 font-semibold text-[#4b5563] text-[14px]">
                Subscription Cancelled
              </Text>
            </Section>

            <Heading
              as="h1"
              className="m-0 mb-[24px] text-center font-bold text-[#1a1a1a] text-[24px] leading-[32px]"
            >
              We're Sorry to See You Go
            </Heading>

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              Hi {userName},
            </Text>

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              Your <strong>{planName}</strong> subscription has been cancelled.
              We're sorry to see you go!
            </Text>

            <Section className="my-[24px] rounded-[8px] bg-[#f9fafb] p-[20px]">
              <Text className="m-0 mb-[4px] font-semibold text-[#6b7280] text-[12px] uppercase">
                Plan
              </Text>
              <Text className="m-0 mb-[16px] text-[#1f2937] text-[14px]">
                {planName}
              </Text>

              <Text className="m-0 mb-[4px] font-semibold text-[#6b7280] text-[12px] uppercase">
                Access Until
              </Text>
              <Text className="m-0 mb-[16px] text-[#1f2937] text-[14px]">
                {accessUntil}
              </Text>

              <Text className="m-0 mb-[4px] font-semibold text-[#6b7280] text-[12px] uppercase">
                Reason
              </Text>
              <Text className="m-0 mb-[16px] text-[#1f2937] text-[14px]">
                {cancellationReason}
              </Text>
            </Section>

            <Section className="my-[24px] rounded-[8px] bg-[#eff6ff] p-[16px]">
              <Text className="m-0 mb-[8px] font-semibold text-[#1e40af] text-[14px]">
                What happens next?
              </Text>
              <Text className="m-0 mb-[4px] text-[#1e40af] text-[14px]">
                • You'll retain access to all {planName} features until{" "}
                {accessUntil}
              </Text>
              <Text className="m-0 mb-[4px] text-[#1e40af] text-[14px]">
                • After that date, your account will revert to the free plan
              </Text>
              <Text className="m-0 mb-[4px] text-[#1e40af] text-[14px]">
                • Your data will be preserved, but some features will be limited
              </Text>
            </Section>

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              Changed your mind? You can reactivate your subscription anytime
              before {accessUntil} and continue where you left off.
            </Text>

            <Section className="my-[16px] text-center">
              <Button
                className="inline-block rounded-[8px] bg-[#6366f1] px-[32px] py-[12px] text-center font-semibold text-[16px] text-white no-underline"
                href={reactivateUrl}
              >
                Reactivate Subscription
              </Button>
            </Section>

            <Section className="my-[16px] text-center">
              <Button
                className="inline-block rounded-[8px] border border-[#6366f1] bg-white px-[24px] py-[10px] text-center font-semibold text-[#6366f1] text-[14px] no-underline"
                href={feedbackUrl}
              >
                Share Feedback
              </Button>
            </Section>

            <Hr className="my-[32px] border-[#e6ebf1]" />

            <Text className="m-0 mb-[8px] text-[#8898aa] text-[14px] leading-[22px]">
              We'd love to hear why you cancelled. Your feedback helps us
              improve SaaS App for everyone.
            </Text>

            <Text className="m-0 mb-[8px] text-[#8898aa] text-[14px] leading-[22px]">
              Thank you for being a SaaS App subscriber. We hope to see you
              again soon!
            </Text>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

SubscriptionCancelled.PreviewProps = {
  userName: "there",
  planName: "Pro",
  accessUntil: "January 13, 2025",
  cancellationReason: "User requested",
  reactivateUrl: "https://example.com/pricing",
  feedbackUrl: "https://example.com/feedback",
} satisfies SubscriptionCancelledProps;
