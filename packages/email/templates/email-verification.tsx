import { Text } from "@react-email/components";
import {
  EmailButton,
  EmailLayout,
  EmailLink,
  EmailText,
  Heading,
} from "../components";

type EmailVerificationProps = {
  userEmail?: string;
  userName?: string;
  verificationUrl?: string;
};

export default function EmailVerification({
  userEmail = "user@example.com",
  userName = "there",
  verificationUrl = "https://example.com/auth/verify?token=xxx",
}: EmailVerificationProps) {
  return (
    <EmailLayout
      footerContent="This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email."
      preview="Verify your email address"
    >
      <Heading>Verify Your Email</Heading>

      <EmailText>Hi {userName},</EmailText>

      <EmailText>
        Thanks for signing up! Please verify your email address{" "}
        <strong>{userEmail}</strong> to complete your registration.
      </EmailText>

      <EmailButton href={verificationUrl}>Verify Email Address</EmailButton>

      <EmailText variant="small">
        Or copy and paste this URL into your browser:
      </EmailText>
      <Text style={{ margin: "0 0 16px" }}>
        <EmailLink href={verificationUrl} showUrl />
      </Text>
    </EmailLayout>
  );
}
