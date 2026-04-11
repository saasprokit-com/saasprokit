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

type TwoFactorOTPEmailProps = {
  userEmail?: string;
  otp?: string;
  expiresInMinutes?: number;
};

export default function TwoFactorOTPEmail({
  userEmail = "user@example.com",
  otp = "123456",
  expiresInMinutes = 5,
}: TwoFactorOTPEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Use this code to complete your sign-in</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Verification Code</Heading>

          <Text style={text}>Hi,</Text>

          <Text style={text}>
            You're trying to sign in to your account. Use the verification code
            below to complete your login:
          </Text>

          <Section style={codeContainer}>
            <Text style={code}>{otp}</Text>
          </Section>

          <Text style={text}>
            This code will expire in <strong>{expiresInMinutes} minutes</strong>
            .
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            If you didn't try to sign in, someone else may be trying to access
            your account. Please secure your account immediately by changing
            your password.
          </Text>

          <Text style={footer}>
            This email was sent to <strong>{userEmail}</strong> by SaaS App.
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

const codeContainer = {
  backgroundColor: "#f4f4f5",
  borderRadius: "8px",
  margin: "24px 0",
  padding: "24px",
  textAlign: "center" as const,
};

const code = {
  color: "#1a1a1a",
  fontSize: "36px",
  fontWeight: "700",
  letterSpacing: "8px",
  margin: "0",
  fontFamily: "monospace",
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
