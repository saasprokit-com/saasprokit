import { Text } from "@react-email/components";
import {
  EmailButton,
  EmailLayout,
  EmailLink,
  EmailText,
  Heading,
} from "../components";

type PasswordResetEmailProps = {
  userEmail?: string;
  resetUrl?: string;
};

export default function PasswordResetEmail({
  userEmail = "user@example.com",
  resetUrl = "https://example.com/auth/reset-password?token=xxx",
}: PasswordResetEmailProps) {
  return (
    <EmailLayout
      footerContent="If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged."
      preview="Reset your password"
    >
      <Heading>Reset Your Password</Heading>

      <EmailText>Hi,</EmailText>

      <EmailText>
        We received a request to reset the password for the account associated
        with <strong>{userEmail}</strong>.
      </EmailText>

      <EmailText>
        Click the button below to reset your password. This link will expire in
        1 hour.
      </EmailText>

      <EmailButton href={resetUrl}>Reset Password</EmailButton>

      <EmailText variant="small">
        Or copy and paste this URL into your browser:
      </EmailText>
      <Text style={{ margin: "0 0 16px" }}>
        <EmailLink href={resetUrl} showUrl />
      </Text>
    </EmailLayout>
  );
}
