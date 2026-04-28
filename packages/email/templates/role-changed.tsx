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

interface RoleChangedProps {
  userName?: string;
  organizationName?: string;
  previousRole?: string;
  newRole?: string;
  changedBy?: string;
  changedAt?: string;
  dashboardUrl?: string;
}

export default function RoleChanged({
  userName = "there",
  organizationName = "Acme Inc",
  previousRole = "Member",
  newRole = "Admin",
  changedBy = "John Doe",
  changedAt = "December 13, 2024 at 10:30 AM",
  dashboardUrl = "https://example.com/dashboard",
}: RoleChangedProps) {
  const isPromotion =
    (previousRole === "Member" && newRole === "Admin") ||
    (previousRole === "Member" && newRole === "Owner") ||
    (previousRole === "Admin" && newRole === "Owner");

  return (
    <Html>
      <Head />
      <Preview>Your role in {organizationName} has been updated</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={isPromotion ? promotionBanner : updateBanner}>
            <Text style={isPromotion ? promotionText : updateText}>
              {isPromotion ? "Congratulations!" : "Role Update"}
            </Text>
          </Section>

          <Heading style={h1}>Your Role Has Changed</Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            Your role in <strong>{organizationName}</strong> has been updated by{" "}
            <strong>{changedBy}</strong>.
          </Text>

          <Section style={detailsBox}>
            <Text style={detailLabel}>Organization</Text>
            <Text style={detailValue}>{organizationName}</Text>

            <Text style={detailLabel}>Previous Role</Text>
            <Text style={detailValue}>{previousRole}</Text>

            <Text style={detailLabel}>New Role</Text>
            <Text style={newRoleValue}>{newRole}</Text>

            <Text style={detailLabel}>Changed By</Text>
            <Text style={detailValue}>{changedBy}</Text>

            <Text style={detailLabel}>Changed At</Text>
            <Text style={detailValue}>{changedAt}</Text>
          </Section>

          {isPromotion ? (
            <Text style={text}>
              With your new role, you now have additional permissions and
              responsibilities in the organization.
            </Text>
          ) : (
            <Text style={text}>
              Your permissions in the organization have been adjusted based on
              your new role.
            </Text>
          )}

          <Section style={buttonContainer}>
            <Button href={dashboardUrl} style={button}>
              Go to Dashboard
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            If you have questions about this change, please contact your
            organization administrator.
          </Text>

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

const promotionBanner = {
  backgroundColor: "#dcfce7",
  borderRadius: "8px",
  padding: "12px",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const promotionText = {
  color: "#166534",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0",
};

const updateBanner = {
  backgroundColor: "#dbeafe",
  borderRadius: "8px",
  padding: "12px",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const updateText = {
  color: "#1e40af",
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

const newRoleValue = {
  color: "#6366f1",
  fontSize: "14px",
  fontWeight: "600",
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
