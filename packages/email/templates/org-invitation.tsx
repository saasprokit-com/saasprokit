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

interface OrgInvitationProps {
  expiresAt?: string;
  inviteeEmail?: string;
  inviterName?: string;
  inviteUrl?: string;
  message?: string;
  organizationName?: string;
  role?: string;
}

export default function OrgInvitation({
  inviteeEmail = "user@example.com",
  inviterName = "John Doe",
  organizationName = "Acme Inc",
  role = "Member",
  inviteUrl = "https://example.com/invite/accept?token=xxx",
  expiresAt = "7 days",
  message,
}: OrgInvitationProps) {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>You've been invited to join {organizationName}</Preview>
        <Body className="bg-[#f6f9fc] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Ubuntu,sans-serif]">
          <Container className="mx-auto my-0 max-w-[560px] rounded-[8px] bg-white px-[20px] py-[40px]">
            <Heading
              as="h1"
              className="m-0 mb-[24px] text-center font-bold text-[#1a1a1a] text-[24px] leading-[32px]"
            >
              You're Invited!
            </Heading>

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              Hi,
            </Text>

            <Text className="m-0 mb-[16px] text-[#525f7f] text-[16px] leading-[26px]">
              <strong>{inviterName}</strong> has invited you to join{" "}
              <strong>{organizationName}</strong> on SaaS App.
            </Text>

            <Section className="my-[24px] rounded-[8px] border border-[#bae6fd] bg-[#f0f9ff] p-[20px]">
              <Text className="m-0 mb-[4px] font-semibold text-[#6b7280] text-[12px] uppercase">
                Organization
              </Text>
              <Text className="m-0 mb-[16px] text-[#1f2937] text-[14px]">
                {organizationName}
              </Text>

              <Text className="m-0 mb-[4px] font-semibold text-[#6b7280] text-[12px] uppercase">
                Your Role
              </Text>
              <Text className="m-0 mb-[16px] text-[#1f2937] text-[14px]">
                {role}
              </Text>

              <Text className="m-0 mb-[4px] font-semibold text-[#6b7280] text-[12px] uppercase">
                Invited By
              </Text>
              <Text className="m-0 mb-[16px] text-[#1f2937] text-[14px]">
                {inviterName}
              </Text>
            </Section>

            {message && (
              <Section className="my-[24px] rounded-[8px] border-l-4 border-l-[#6366f1] bg-[#f9fafb] p-[16px]">
                <Text className="m-0 mb-[8px] font-semibold text-[#6b7280] text-[12px]">
                  Message from {inviterName}:
                </Text>
                <Text className="m-0 text-[#374151] text-[14px] italic">
                  "{message}"
                </Text>
              </Section>
            )}

            <Section className="my-[32px] text-center">
              <Button
                className="inline-block rounded-[8px] bg-[#6366f1] px-[32px] py-[12px] text-center font-semibold text-[16px] text-white no-underline"
                href={inviteUrl}
              >
                Accept Invitation
              </Button>
            </Section>

            <Hr className="my-[32px] border-[#e6ebf1]" />

            <Text className="m-0 mb-[8px] text-[#8898aa] text-[14px] leading-[22px]">
              This invitation will expire in {expiresAt}. If you don't want to
              join, you can safely ignore this email.
            </Text>

            <Text className="m-0 mb-[8px] text-[#8898aa] text-[14px] leading-[22px]">
              This email was sent to {inviteeEmail} by SaaS App.
            </Text>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

OrgInvitation.PreviewProps = {
  inviteeEmail: "user@example.com",
  inviterName: "John Doe",
  organizationName: "Acme Inc",
  role: "Member",
  inviteUrl: "https://example.com/invite/accept?token=xxx",
  expiresAt: "7 days",
  message: undefined,
} satisfies OrgInvitationProps;
