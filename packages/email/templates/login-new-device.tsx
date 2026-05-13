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

interface LoginNewDeviceProps {
  userEmail?: string;
  userName?: string;
  deviceInfo?: string;
  location?: string;
  ipAddress?: string;
  loginTime?: string;
  secureAccountUrl?: string;
}

export default function LoginNewDevice({
  userEmail = "user@example.com",
  userName = "there",
  deviceInfo = "Chrome on Windows",
  location = "San Francisco, CA, USA",
  ipAddress = "192.168.1.1",
  loginTime = "December 13, 2024 at 10:30 AM",
  secureAccountUrl = "https://example.com/user/profile",
}: LoginNewDeviceProps) {
  return (
    <Html>
      <Head />
      <Preview>New login to your account</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={alertBanner}>
            <Text style={alertText}>Security Alert</Text>
          </Section>

          <Heading style={h1}>New Login Detected</Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            We noticed a new sign-in to your account ({userEmail}) from a device
            or location you don't usually use.
          </Text>

          <Section style={detailsBox}>
            <Text style={detailLabel}>Device</Text>
            <Text style={detailValue}>{deviceInfo}</Text>

            <Text style={detailLabel}>Location</Text>
            <Text style={detailValue}>{location}</Text>

            <Text style={detailLabel}>IP Address</Text>
            <Text style={detailValue}>{ipAddress}</Text>

            <Text style={detailLabel}>Time</Text>
            <Text style={detailValue}>{loginTime}</Text>
          </Section>

          <Text style={text}>
            If this was you, you can safely ignore this email. If you didn't
            sign in, someone may have access to your account.
          </Text>

          <Section style={buttonContainer}>
            <Button href={secureAccountUrl} style={button}>
              Secure My Account
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            We recommend changing your password and enabling two-factor
            authentication if you haven't already.
          </Text>

          <Text style={footer}>
            This email was sent by SaaS App. If you have any questions, please
            contact our support team.
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
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  padding: "12px",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const alertText = {
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
