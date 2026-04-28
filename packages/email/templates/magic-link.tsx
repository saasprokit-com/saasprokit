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

interface MagicLinkEmailProps {
  userEmail?: string;
  magicLinkUrl?: string;
  expiresInMinutes?: number;
}

export default function MagicLinkEmail({
  userEmail = "user@example.com",
  magicLinkUrl = "https://example.com/auth/magic-link/verify?token=abc123",
  expiresInMinutes = 10,
}: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Sign in to your account with this magic link</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Sign in to your account</Heading>

          <Text style={text}>Hi,</Text>

          <Text style={text}>
            Click the button below to sign in to your account. This magic link
            will expire in <strong>{expiresInMinutes} minutes</strong>.
          </Text>

          <Section style={buttonContainer}>
            <Button href={magicLinkUrl} style={button}>
              Sign in to your account
            </Button>
          </Section>

          <Text style={text}>
            Or copy and paste this URL into your browser:
          </Text>

          <Text style={link}>{magicLinkUrl}</Text>

          <Hr style={hr} />

          <Text style={footer}>
            If you didn't request this email, you can safely ignore it. Someone
            may have typed your email address by mistake.
          </Text>

          <Text style={footer}>
            This email was sent to <strong>{userEmail}</strong>.
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

const buttonContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button = {
  backgroundColor: "#000000",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const link = {
  color: "#3b82f6",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 16px",
  wordBreak: "break-all" as const,
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
