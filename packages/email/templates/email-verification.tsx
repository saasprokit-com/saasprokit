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

interface EmailVerificationProps {
  userEmail?: string;
  userName?: string;
  verificationUrl?: string;
}

export default function EmailVerification({
  userEmail = "user@example.com",
  userName = "there",
  verificationUrl = "https://example.com/auth/verify?token=xxx",
}: EmailVerificationProps) {
  return (
    <Tailwind>
      <Html>
        <Head>
          <meta content="light" name="color-scheme" />
          <meta content="light" name="supported-color-schemes" />
        </Head>
        <Preview>Verify your email address</Preview>
        <Body className="bg-[#f6f9fc] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Ubuntu,sans-serif]">
          <Container className="mx-auto my-0 max-w-[560px] rounded-[8px] bg-white px-[20px] py-[40px]">
            <Heading
              as="h1"
              className="m-0 mb-[24px] text-center font-bold text-[#1a1a1a] text-[24px] leading-[32px]"
            >
              Verify Your Email
            </Heading>

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              Hi {userName},
            </Text>

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              Thanks for signing up! Please verify your email address{" "}
              <strong>{userEmail}</strong> to complete your registration.
            </Text>

            <Section className="my-[32px] text-center">
              <Button
                className="inline-block rounded-[8px] bg-[#6366f1] px-[32px] py-[12px] text-center font-semibold text-[16px] text-white no-underline"
                href={verificationUrl}
              >
                Verify Email Address
              </Button>
            </Section>

            <Text className="m-0 mb-[12px] text-[#525f7f] text-[14px] leading-[22px]">
              Or copy and paste this URL into your browser:
            </Text>
            <Text className="m-0 mb-[16px]">
              <Link
                className="break-all text-[#6366f1] text-[14px]"
                href={verificationUrl}
              >
                {verificationUrl}
              </Link>
            </Text>

            <Hr className="my-[32px] border-[#e6ebf1]" />

            <Text className="m-0 mb-[8px] text-[#666666] text-[14px] leading-[22px]">
              This link will expire in 24 hours. If you didn't create an
              account, you can safely ignore this email.
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

EmailVerification.PreviewProps = {
  userEmail: "user@example.com",
  userName: "there",
  verificationUrl: "https://example.com/auth/verify?token=xxx",
} satisfies EmailVerificationProps;
