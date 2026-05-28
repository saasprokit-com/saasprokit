import { SetBreadcrumbs } from "@repo/design-system/components/layout/breadcrumb-context";
import { ContentSection } from "@repo/design-system/components/layout/content-section";
import { getDictionary } from "@repo/internationalization";
import { accountRoutes } from "@/lib/routes";
import { DeleteAccountForm } from "../components/delete-account-form";

export const metadata = {
  title: "Delete Account",
  description: "Permanently delete your account",
};

interface DangerZonePageProps {
  params: Promise<{ locale: string }>;
}

export default async function DangerZonePage({ params }: DangerZonePageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return (
    <>
      <SetBreadcrumbs
        items={[
          { label: "Account", href: accountRoutes.profile() },
          { label: "Danger Zone" },
        ]}
      />
      <ContentSection
        description="Permanently delete your account and all associated data"
        title="Danger Zone"
      >
        <DeleteAccountForm errors={dict.errors.action} />
      </ContentSection>
    </>
  );
}
