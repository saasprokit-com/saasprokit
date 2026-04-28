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
  Text,
} from "@react-email/components";

interface SubscriptionCancelledProps {
  userName?: string;
  planName?: string;
  accessUntil?: string;
  cancellationReason?: string;
  reactivateUrl?: string;
  feedbackUrl?: string;
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
    <Html>
      <Head />
      <Preview>Your {planName} subscription has been cancelled</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={noticeBanner}>
            <Text style={noticeText}>Subscription Cancelled</Text>
          </Section>

          <Heading style={h1}>We're Sorry to See You Go</Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            Your <strong>{planName}</strong> subscription has been cancelled.
            We're sorry to see you go!
          </Text>

          <Section style={detailsBox}>
            <Text style={detailLabel}>Plan</Text>
            <Text style={detailValue}>{planName}</Text>

            <Text style={detailLabel}>Access Until</Text>
            <Text style={detailValue}>{accessUntil}</Text>

            <Text style={detailLabel}>Reason</Text>
            <Text style={detailValue}>{cancellationReason}</Text>
          </Section>

          <Section style={infoBox}>
            <Text style={infoTitle}>What happens next?</Text>
            <Text style={infoText}>
              • You'll retain access to all {planName} features until{" "}
              {accessUntil}
            </Text>
            <Text style={infoText}>
              • After that date, your account will revert to the free plan
            </Text>
            <Text style={infoText}>
              • Your data will be preserved, but some features will be limited
            </Text>
          </Section>

          <Text style={text}>
            Changed your mind? You can reactivate your subscription anytime
            before {accessUntil} and continue where you left off.
          </Text>

          <Section style={buttonContainer}>
            <Button href={reactivateUrl} style={primaryButton}>
              Reactivate Subscription
            </Button>
          </Section>

          <Section style={buttonContainer}>
            <Button href={feedbackUrl} style={secondaryButton}>
              Share Feedback
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            We'd love to hear why you cancelled. Your feedback helps us improve
            SaaS App for everyone.
          </Text>

          <Text style={footer}>
            Thank you for being a SaaS App subscriber. We hope to see you again
            soon!
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const noticeBanner = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "12px",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const noticeText = {
  color: "#4b5563",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "700",
  lineHeight: "32px",
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const text = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 16px",
};

const detailsBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const detailLabel = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  margin: "0 0 4px",
};

const detailValue = {
  color: "#1f2937",
  fontSize: "14px",
  margin: "0 0 16px",
};

const infoBox = {
  backgroundColor: "#eff6ff",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
};

const infoTitle = {
  color: "#1e40af",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const infoText = {
  color: "#1e40af",
  fontSize: "14px",
  margin: "0 0 4px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "16px 0",
};

const primaryButton = {
  backgroundColor: "#6366f1",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
};

const secondaryButton = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  color: "#6366f1",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "10px 24px",
  border: "1px solid #6366f1",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "32px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 8px",
};
