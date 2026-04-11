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

type SubscriptionRenewedProps = {
  userName?: string;
  planName?: string;
  amount?: string;
  billingInterval?: string;
  renewalDate?: string;
  nextBillingDate?: string;
  dashboardUrl?: string;
};

export default function SubscriptionRenewed({
  userName = "there",
  planName = "Pro",
  amount = "$19.00",
  billingInterval = "monthly",
  renewalDate = "December 13, 2024",
  nextBillingDate = "January 13, 2025",
  dashboardUrl = "https://example.com/user",
}: SubscriptionRenewedProps) {
  return (
    <Html>
      <Head />
      <Preview>Your {planName} subscription has been renewed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={successBanner}>
            <Text style={successText}>Renewal Successful</Text>
          </Section>

          <Heading style={h1}>Subscription Renewed</Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            Great news! Your <strong>{planName}</strong> subscription has been
            automatically renewed. You'll continue to have access to all your
            premium features.
          </Text>

          <Section style={detailsBox}>
            <Text style={detailLabel}>Plan</Text>
            <Text style={detailValue}>{planName}</Text>

            <Text style={detailLabel}>Amount Charged</Text>
            <Text style={detailValue}>
              {amount}/{billingInterval}
            </Text>

            <Text style={detailLabel}>Renewal Date</Text>
            <Text style={detailValue}>{renewalDate}</Text>

            <Text style={detailLabel}>Next Billing Date</Text>
            <Text style={detailValue}>{nextBillingDate}</Text>
          </Section>

          <Section style={reminderBox}>
            <Text style={reminderText}>
              Your next renewal will be on {nextBillingDate}. You can manage
              your subscription or update your payment method anytime.
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button href={dashboardUrl} style={button}>
              Manage Subscription
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Thank you for your continued support! If you have any questions
            about your subscription, we're here to help.
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

const reminderBox = {
  backgroundColor: "#f0f9ff",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
};

const reminderText = {
  color: "#0369a1",
  fontSize: "14px",
  margin: "0",
  lineHeight: "22px",
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
