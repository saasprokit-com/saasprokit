import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface PasswordResetEmailProps {
  resetUrl?: string;
  userEmail?: string;
}

export default function PasswordResetEmail({
  userEmail = "user@example.com",
  resetUrl = "https://example.com/auth/reset-password?token=xxx",
}: PasswordResetEmailProps) {
  return (
    <Tailwind>
      <Html>
        <Head>
          <meta content="light" name="color-scheme" />
          <meta content="light" name="supported-color-schemes" />
        </Head>
        <Preview>Reset your password</Preview>
        <Body className="bg-[#f6f9fc] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Ubuntu,sans-serif]">
          <Container className="mx-auto my-0 max-w-[560px] rounded-[8px] bg-white px-[20px] py-[40px]">
            <Heading
              as="h1"
              className="m-0 mb-[24px] text-center font-bold text-[#1a1a1a] text-[24px] leading-[32px]"
            >
              Reset Your Password
            </Heading>

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              Hi,
            </Text>

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              We received a request to reset the password for the account
              associated with <strong>{userEmail}</strong>.
            </Text>

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              Click the button below to reset your password. This link will
              expire in 1 hour.
            </Text>

            <Section className="my-[32px] text-center">
              <Button
                className="inline-block rounded-[8px] bg-[#6366f1] px-[32px] py-[12px] text-center font-semibold text-[16px] text-white no-underline"
                href={resetUrl}
              >
                Reset Password
              </Button>
            </Section>

            <Text className="m-0 mb-[12px] text-[#525f7f] text-[14px] leading-[22px]">
              Or copy and paste this URL into your browser:
            </Text>
            <Text className="m-0 mb-[16px]">
              <Link
                className="break-all text-[#6366f1] text-[14px]"
                href={resetUrl}
              >
                {resetUrl}
              </Link>
            </Text>

            <Hr className="my-[32px] border-[#e6ebf1]" />

            <Text className="m-0 mb-[8px] text-[#666666] text-[14px] leading-[22px]">
              If you didn't request a password reset, you can safely ignore this
              email. Your password will remain unchanged.
            </Text>
            <Text className="m-0 mb-[8px] text-[#666666] text-[14px] leading-[22px]">
              This email was sent by SaaS App. If you have any questions, please
              contact our support team.
            </Text>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

PasswordResetEmail.PreviewProps = {
  userEmail: "user@example.com",
  resetUrl: "https://example.com/auth/reset-password?token=xxx",
} satisfies PasswordResetEmailProps;
