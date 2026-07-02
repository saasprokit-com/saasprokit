import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface AccountDeletedProps {
  deletedAt?: string;
  supportEmail?: string;
  userName?: string;
}

export default function AccountDeleted({
  userName = "there",
  deletedAt = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }),
  supportEmail = "support@example.com",
}: AccountDeletedProps) {
  return (
    <Html>
      <Head />
      <Preview>Your account has been successfully deleted</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={confirmationBanner}>
            <Text style={confirmationText}>Account Deleted</Text>
          </Section>

          <Heading style={h1}>We're Sorry to See You Go</Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            This email confirms that your account was successfully deleted on{" "}
            <strong>{deletedAt}</strong>.
          </Text>

          <Section style={detailsBox}>
            <Text style={detailsTitle}>What's been removed:</Text>
            <Text style={detailItem}>
              Your profile and personal information
            </Text>
            <Text style={detailItem}>All your published articles</Text>
            <Text style={detailItem}>Your bookmarks and saved items</Text>
            <Text style={detailItem}>Organization memberships</Text>
          </Section>

          <Section style={infoBox}>
            <Text style={infoTitle}>Important Information</Text>
            <Text style={infoText}>
              Some data may be retained for legal and compliance purposes for up
              to 30 days. After this period, all data will be permanently
              erased.
            </Text>
          </Section>

          <Text style={text}>
            If you didn't request this deletion or believe this was done in
            error, please contact us immediately at{" "}
            <a href={`mailto:${supportEmail}`} style={link}>
              {supportEmail}
            </a>
            .
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Thank you for being part of our community. We hope to see you again
            someday.
          </Text>

          <Text style={footer}>
            You're receiving this email because you deleted your account. You
            will not receive any further emails from us.
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

const confirmationBanner = {
  backgroundColor: "#fee2e2",
  borderRadius: "8px",
  padding: "12px",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const confirmationText = {
  color: "#dc2626",
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
  padding: "16px",
  margin: "24px 0",
};

const detailsTitle = {
  color: "#374151",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const detailItem = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0 0 6px",
  paddingLeft: "12px",
};

const infoBox = {
  backgroundColor: "#fffbeb",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
};

const infoTitle = {
  color: "#92400e",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const infoText = {
  color: "#b45309",
  fontSize: "14px",
  margin: "0",
  lineHeight: "22px",
};

const link = {
  color: "#6366f1",
  textDecoration: "underline",
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
