import {
  Banner,
  EmailButton,
  EmailLayout,
  EmailText,
  Heading,
} from "../components";

type WelcomeEmailProps = {
  name?: string;
  dashboardUrl?: string;
};

export default function WelcomeEmail({
  name = "there",
  dashboardUrl = "https://example.com/dashboard",
}: WelcomeEmailProps) {
  return (
    <EmailLayout
      footerContent="We're here to help! Reply to this email if you have any questions."
      preview="Welcome to our platform"
    >
      <Banner variant="success">Welcome!</Banner>

      <Heading>Welcome, {name}!</Heading>

      <EmailText>
        Thank you for joining us. We're excited to have you on board.
      </EmailText>

      <EmailText>
        Your account is now active and ready to use. Here's what you can do
        next:
      </EmailText>

      <EmailText>
        • <strong>Explore your dashboard</strong> - Get familiar with your new
        workspace
        <br />• <strong>Complete your profile</strong> - Add your details and
        preferences
        <br />• <strong>Start creating</strong> - Jump in and start using the
        platform
      </EmailText>

      <EmailButton href={dashboardUrl}>Go to Dashboard</EmailButton>

      <EmailText variant="muted">
        Need help getting started? Check out our documentation or reach out to
        our support team.
      </EmailText>
    </EmailLayout>
  );
}
