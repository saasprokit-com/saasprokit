import {
  Banner,
  DetailItem,
  DetailsBox,
  EmailButton,
  EmailLayout,
  EmailText,
  Heading,
  InfoBox,
} from "../components";

interface AccountLockedProps {
  failedAttempts?: number;
  lockedAt?: string;
  lockReason?: string;
  resetPasswordUrl?: string;
  supportEmail?: string;
  unlockTime?: string;
  userEmail?: string;
  userName?: string;
}

export default function AccountLocked({
  userEmail = "user@example.com",
  userName = "there",
  lockReason = "Too many failed login attempts",
  failedAttempts = 5,
  lockedAt = "December 13, 2024 at 10:30 AM",
  unlockTime = "1 hour",
  resetPasswordUrl = "https://example.com/auth/forgot-password",
  supportEmail = "support@example.com",
}: AccountLockedProps) {
  return (
    <EmailLayout
      footerContent={`Your account will automatically unlock after ${unlockTime}. If you need help, contact our support team at ${supportEmail}.`}
      preview="Your account has been temporarily locked"
    >
      <Banner variant="error">Account Security</Banner>

      <Heading>Account Temporarily Locked</Heading>

      <EmailText>Hi {userName},</EmailText>

      <EmailText>
        We've temporarily locked your account ({userEmail}) due to multiple
        failed login attempts. This is a security measure to protect your
        account.
      </EmailText>

      <DetailsBox>
        <DetailItem label="Locked At" value={lockedAt} />
        <DetailItem label="Reason" value={lockReason} />
        {failedAttempts && (
          <DetailItem
            label="Failed Attempts"
            value={`${failedAttempts} attempts`}
          />
        )}
        <DetailItem isLast label="Auto-Unlock" value={`After ${unlockTime}`} />
      </DetailsBox>

      <EmailText>
        If this was you trying to sign in, you can reset your password to regain
        access immediately.
      </EmailText>

      <EmailButton href={resetPasswordUrl}>Reset Password</EmailButton>

      <InfoBox variant="yellow">
        If you didn't attempt to sign in, someone may be trying to access your
        account. We recommend changing your password after unlocking.
      </InfoBox>
    </EmailLayout>
  );
}
