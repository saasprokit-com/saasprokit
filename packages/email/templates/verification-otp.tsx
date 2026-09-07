import {
  Body,
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

interface VerificationOTPEmailProps {
  expiresInMinutes?: number;
  otp?: string;
  userEmail?: string;
}

export default function VerificationOTPEmail({
  userEmail = "user@example.com",
  otp = "123456",
  expiresInMinutes = 5,
}: VerificationOTPEmailProps) {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>Use this code to verify your email address</Preview>
        <Body className="bg-[#f6f9fc] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Ubuntu,sans-serif]">
          <Container className="mx-auto my-0 max-w-[560px] rounded-[8px] bg-white px-[20px] py-[40px]">
            <Heading
              as="h1"
              className="m-0 mb-[24px] text-center font-bold text-[#1a1a1a] text-[24px] leading-[32px]"
            >
              Verify your email address
            </Heading>

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              Hi,
            </Text>

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              Please use the following code to verify your email address. This
              code will expire in <strong>{expiresInMinutes} minutes</strong>.
            </Text>

            <Section className="my-[24px] rounded-[8px] bg-[#f4f4f5] p-[24px] text-center">
              <Text className="m-0 font-[monospace] font-bold text-[#1a1a1a] text-[36px] tracking-[8px]">
                {otp}
              </Text>
            </Section>

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              Once verified, you'll have full access to your account.
            </Text>

            <Hr className="my-[32px] border-[#e6ebf1]" />

            <Text className="m-0 mb-[8px] text-[#8898aa] text-[14px] leading-[22px]">
              If you didn't create an account, you can safely ignore this email.
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

VerificationOTPEmail.PreviewProps = {
  userEmail: "user@example.com",
  otp: "123456",
  expiresInMinutes: 5,
} satisfies VerificationOTPEmailProps;
