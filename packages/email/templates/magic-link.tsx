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
  Tailwind,
  Text,
} from "@react-email/components";

interface MagicLinkEmailProps {
  expiresInMinutes?: number;
  magicLinkUrl?: string;
  userEmail?: string;
}

export default function MagicLinkEmail({
  userEmail = "user@example.com",
  magicLinkUrl = "https://example.com/auth/magic-link/verify?token=abc123",
  expiresInMinutes = 10,
}: MagicLinkEmailProps) {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>Sign in to your account with this magic link</Preview>
        <Body className="bg-[#f6f9fc] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Ubuntu,sans-serif]">
          <Container className="mx-auto my-0 max-w-[560px] rounded-[8px] bg-white px-[20px] py-[40px]">
            <Heading
              as="h1"
              className="m-0 mb-[24px] text-center font-bold text-[#1a1a1a] text-[24px] leading-[32px]"
            >
              Sign in to your account
            </Heading>

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              Hi,
            </Text>

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              Click the button below to sign in to your account. This magic link
              will expire in <strong>{expiresInMinutes} minutes</strong>.
            </Text>

            <Section className="my-[24px] text-center">
              <Button
                className="inline-block rounded-[8px] bg-black px-[24px] py-[12px] text-center font-semibold text-[16px] text-white no-underline"
                href={magicLinkUrl}
              >
                Sign in to your account
              </Button>
            </Section>

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              Or copy and paste this URL into your browser:
            </Text>

            <Text className="m-0 mb-[16px] break-all text-[#3b82f6] text-[14px] leading-[22px]">
              {magicLinkUrl}
            </Text>

            <Hr className="my-[32px] border-[#e6ebf1]" />

            <Text className="m-0 mb-[8px] text-[#8898aa] text-[14px] leading-[22px]">
              If you didn't request this email, you can safely ignore it.
              Someone may have typed your email address by mistake.
            </Text>

            <Text className="m-0 mb-[8px] text-[#8898aa] text-[14px] leading-[22px]">
              This email was sent to <strong>{userEmail}</strong>.
            </Text>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

MagicLinkEmail.PreviewProps = {
  userEmail: "user@example.com",
  magicLinkUrl: "https://example.com/auth/magic-link/verify?token=abc123",
  expiresInMinutes: 10,
} satisfies MagicLinkEmailProps;
