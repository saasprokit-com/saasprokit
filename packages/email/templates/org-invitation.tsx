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

type OrgInvitationProps = {
  inviteeEmail?: string;
  inviterName?: string;
  organizationName?: string;
  role?: string;
  inviteUrl?: string;
  expiresAt?: string;
  message?: string;
};

export default function OrgInvitation({
  inviteeEmail = "user@example.com",
  inviterName = "John Doe",
  organizationName = "Acme Inc",
  role = "Member",
  inviteUrl = "https://example.com/invite/accept?token=xxx",
  expiresAt = "7 days",
  message,
}: OrgInvitationProps) {
  return (
    <Html>
      <Head />
      <Preview>You've been invited to join {organizationName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You're Invited!</Heading>

          <Text style={text}>Hi,</Text>

          <Text style={text}>
            <strong>{inviterName}</strong> has invited you to join{" "}
            <strong>{organizationName}</strong> on SaaS App.
          </Text>

          <Section style={detailsBox}>
            <Text style={detailLabel}>Organization</Text>
            <Text style={detailValue}>{organizationName}</Text>

            <Text style={detailLabel}>Your Role</Text>
            <Text style={detailValue}>{role}</Text>

            <Text style={detailLabel}>Invited By</Text>
            <Text style={detailValue}>{inviterName}</Text>
          </Section>

          {message && (
            <Section style={messageBox}>
              <Text style={messageLabel}>Message from {inviterName}:</Text>
              <Text style={messageText}>"{message}"</Text>
            </Section>
          )}

          <Section style={buttonContainer}>
            <Button href={inviteUrl} style={button}>
              Accept Invitation
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            This invitation will expire in {expiresAt}. If you don't want to
            join, you can safely ignore this email.
          </Text>

          <Text style={footer}>
            This email was sent to {inviteeEmail} by SaaS App.
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
  backgroundColor: "#f0f9ff",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
  border: "1px solid #bae6fd",
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

const messageBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
  borderLeft: "4px solid #6366f1",
};

const messageLabel = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const messageText = {
  color: "#374151",
  fontSize: "14px",
  fontStyle: "italic" as const,
  margin: "0",
};
