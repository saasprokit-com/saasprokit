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
    <Html>
      <Head />
      <Preview>Welcome to {planName} - Your subscription is active!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={successBanner}>
            <Text style={successText}>Subscription Activated</Text>
          </Section>

          <Heading style={h1}>Welcome to {planName}!</Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            Thank you for subscribing! Your <strong>{planName}</strong> plan is
            now active, and you have access to all premium features.
          </Text>

          <Section style={detailsBox}>
            <Text style={detailLabel}>Plan</Text>
            <Text style={detailValue}>{planName}</Text>

            <Text style={detailLabel}>Billing</Text>
            <Text style={detailValue}>
              {amount}/{billingInterval}
            </Text>

            <Text style={detailLabel}>Next Billing Date</Text>
            <Text style={detailValue}>{nextBillingDate}</Text>
          </Section>

          <Text style={text}>Here's what you can do with your new plan:</Text>

          <Section style={featuresBox}>
            <Text style={featureItem}>Unlimited articles</Text>
            <Text style={featureItem}>Advanced analytics</Text>
            <Text style={featureItem}>Priority support</Text>
            <Text style={featureItem}>Create organizations</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button href={dashboardUrl} style={button}>
              Go to Dashboard
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            You can manage your subscription anytime from your account settings.
          </Text>

          <Text style={footer}>Thank you for choosing SaaS App!</Text>
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

const successBanner = {
  backgroundColor: "#dcfce7",
  borderRadius: "8px",
  padding: "12px",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const successText = {
  color: "#166534",
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

const featuresBox = {
  backgroundColor: "#f0f9ff",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const featureItem = {
  color: "#0369a1",
  fontSize: "14px",
  margin: "0 0 8px",
  paddingLeft: "20px",
  position: "relative" as const,
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
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
