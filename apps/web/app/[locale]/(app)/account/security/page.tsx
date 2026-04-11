import { SetBreadcrumbs } from "@repo/design-system/components/layout/breadcrumb-context";
import { ContentSection } from "@repo/design-system/components/layout/content-section";
import { getDictionary } from "@repo/internationalization";
import { getServerSession } from "@/lib/auth/auth";
import { accountRoutes } from "@/lib/routes";
import { ChangePasswordForm } from "../components/change-password-form";
import { SessionsManager } from "../components/sessions-manager";
import { TwoFactorManager } from "../components/two-factor-manager";
import { getSecurityPageData } from "./queries";

export const metadata = {
  title: "Security Settings",
  description: "Manage your password, sessions, and two-factor authentication",
};

type SecurityPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function SecurityPage({ params }: SecurityPageProps) {
  const { locale } = await params;
  const [session, dict] = await Promise.all([
    getServerSession(),
    getDictionary(locale),
  ]);

  const { sessions, twoFactorEnabled } = await getSecurityPageData(
    session!.user.id
  );

  const errors = dict.errors.action;

  return (
    <>
      <SetBreadcrumbs
        items={[
          { label: "Account", href: accountRoutes.profile() },
          { label: "Security" },
        ]}
      />
      <ContentSection
        contentClassName="lg:max-w-2xl"
        description="Manage your password, sessions, and two-factor authentication"
        title="Security"
      >
        <ChangePasswordForm errors={errors} />

        <SessionsManager
          currentSessionId={session!.session.id}
          errors={errors}
          sessions={sessions}
        />

        <TwoFactorManager enabled={twoFactorEnabled} errors={errors} />
      </ContentSection>
    </>
  );
}
