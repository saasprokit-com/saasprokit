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

interface RemovedFromOrgProps {
  organizationName?: string;
  removedAt?: string;
  removedBy?: string;
  supportEmail?: string;
  userName?: string;
}

export default function RemovedFromOrg({
  userName = "there",
  organizationName = "Acme Inc",
  removedBy = "John Doe",
  removedAt = "December 13, 2024 at 10:30 AM",
  supportEmail = "support@example.com",
}: RemovedFromOrgProps) {
  return (
    <Html>
      <Head />
      <Preview>You've been removed from {organizationName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={noticeBanner}>
            <Text style={noticeText}>Organization Update</Text>
          </Section>

          <Heading style={h1}>Membership Ended</Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            You've been removed from <strong>{organizationName}</strong>. You no
            longer have access to this organization's content and resources.
          </Text>

          <Section style={detailsBox}>
            <Text style={detailLabel}>Organization</Text>
            <Text style={detailValue}>{organizationName}</Text>

            <Text style={detailLabel}>Removed By</Text>
            <Text style={detailValue}>{removedBy}</Text>

            <Text style={detailLabel}>Date</Text>
            <Text style={detailValue}>{removedAt}</Text>
          </Section>

          <Text style={text}>
            If you believe this was done in error, please contact the
            organization administrator or our support team.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Your personal SaaS App account is still active. You can continue to
            use the platform independently.
          </Text>

          <Text style={footer}>Need help? Contact us at {supportEmail}</Text>
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
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  padding: "12px",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const noticeText = {
  color: "#92400e",
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
