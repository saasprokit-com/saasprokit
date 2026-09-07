import {
  DetailItem,
  DetailsBox,
  EmailButton,
  EmailLayout,
  EmailText,
  Heading,
  InfoBox,
} from "../components";

interface PasswordChangedProps {
  changedAt?: string;
  ipAddress?: string;
  secureAccountUrl?: string;
  userEmail?: string;
  userName?: string;
}

export default function PasswordChanged({
  userEmail = "user@example.com",
  userName = "there",
  changedAt = "December 13, 2024 at 10:30 AM",
  ipAddress = "192.168.1.1",
  secureAccountUrl = "https://example.com/user/profile",
}: PasswordChangedProps) {
  return (
    <EmailLayout
      footerContent="For security, we recommend using a unique password and enabling two-factor authentication."
      preview="Your password has been changed"
    >
      <Heading>Password Changed</Heading>

      <EmailText>Hi {userName},</EmailText>

      <EmailText>
        The password for your account ({userEmail}) was successfully changed.
      </EmailText>

      <DetailsBox>
        <DetailItem label="Changed At" value={changedAt} />
        <DetailItem isLast label="IP Address" value={ipAddress} />
      </DetailsBox>

      <EmailText>
        If you made this change, no further action is needed.
      </EmailText>

      <InfoBox variant="red">
        If you didn't change your password, your account may be compromised.
        Please secure your account immediately.
      </InfoBox>

      <EmailButton href={secureAccountUrl} variant="danger">
        Secure My Account
      </EmailButton>
    </EmailLayout>
  );
}
