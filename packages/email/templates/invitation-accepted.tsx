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

type InvitationAcceptedProps = {
  ownerName?: string;
  newMemberName?: string;
  newMemberEmail?: string;
  organizationName?: string;
  role?: string;
  joinedAt?: string;
  teamUrl?: string;
};

export default function InvitationAccepted({
  ownerName = "there",
  newMemberName = "Jane Smith",
  newMemberEmail = "jane@example.com",
  organizationName = "Acme Inc",
  role = "Member",
  joinedAt = "December 13, 2024 at 10:30 AM",
  teamUrl = "https://example.com/org/team",
}: InvitationAcceptedProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {newMemberName} has joined {organizationName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={successBanner}>
            <Text style={successText}>New Team Member</Text>
          </Section>

          <Heading style={h1}>Invitation Accepted!</Heading>

          <Text style={text}>Hi {ownerName},</Text>

          <Text style={text}>
            Great news! <strong>{newMemberName}</strong> has accepted your
            invitation and joined <strong>{organizationName}</strong>.
          </Text>

          <Section style={detailsBox}>
            <Text style={detailLabel}>New Member</Text>
            <Text style={detailValue}>{newMemberName}</Text>

            <Text style={detailLabel}>Email</Text>
            <Text style={detailValue}>{newMemberEmail}</Text>

            <Text style={detailLabel}>Role</Text>
            <Text style={detailValue}>{role}</Text>

            <Text style={detailLabel}>Joined</Text>
            <Text style={detailValue}>{joinedAt}</Text>
          </Section>

          <Text style={text}>
            You can manage team members and their roles from your organization
            settings.
          </Text>

          <Section style={buttonContainer}>
            <Button href={teamUrl} style={button}>
              View Team
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            This is an automated notification from SaaS App.
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
