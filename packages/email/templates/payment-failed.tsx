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

interface PaymentFailedProps {
  userName?: string;
  planName?: string;
  amount?: string;
  failureReason?: string;
  retryDate?: string;
  updatePaymentUrl?: string;
}

export default function PaymentFailed({
  userName = "there",
  planName = "Pro",
  amount = "$19.00",
  failureReason = "Card declined",
  retryDate = "December 16, 2024",
  updatePaymentUrl = "https://example.com/user/billing",
}: PaymentFailedProps) {
  return (
    <Html>
      <Head />
      <Preview>Action required: Payment failed for your subscription</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={alertBanner}>
            <Text style={alertText}>Payment Failed</Text>
          </Section>

          <Heading style={h1}>We Couldn't Process Your Payment</Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            We tried to charge your payment method for your{" "}
            <strong>{planName}</strong> subscription, but the payment didn't go
            through.
          </Text>

          <Section style={detailsBox}>
            <Text style={detailLabel}>Amount</Text>
            <Text style={detailValue}>{amount}</Text>

            <Text style={detailLabel}>Reason</Text>
            <Text style={detailValue}>{failureReason}</Text>

            <Text style={detailLabel}>Next Retry</Text>
            <Text style={detailValue}>{retryDate}</Text>
          </Section>

          <Text style={warningText}>
            To keep your subscription active and avoid service interruption,
            please update your payment method.
          </Text>

          <Section style={buttonContainer}>
            <Button href={updatePaymentUrl} style={button}>
              Update Payment Method
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            We'll automatically retry the payment on {retryDate}. If the payment
            fails again, your subscription may be cancelled.
          </Text>

          <Text style={footer}>
            Need help? Our support team is here for you.
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

const alertBanner = {
  backgroundColor: "#fee2e2",
  borderRadius: "8px",
  padding: "12px",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const alertText = {
  color: "#991b1b",
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

const warningText = {
  color: "#b45309",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 16px",
  padding: "16px",
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
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

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#dc2626",
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
