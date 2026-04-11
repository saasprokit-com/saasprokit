import { SetBreadcrumbs } from "@repo/design-system/components/layout/breadcrumb-context";
import { ContentSection } from "@repo/design-system/components/layout/content-section";
import { getDictionary } from "@repo/internationalization";
import { getServerSession } from "@/lib/auth/auth";
import { accountRoutes } from "@/lib/routes";
import { ProfileForm } from "../components/profile-form";

export const metadata = {
  title: "Profile Settings",
  description: "Update your profile information",
};

type ProfilePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;
  const [session, dict] = await Promise.all([
    getServerSession(),
    getDictionary(locale),
  ]);

  return (
    <>
      <SetBreadcrumbs
        items={[
          { label: "Account", href: accountRoutes.profile() },
          { label: "Profile" },
        ]}
      />
      <ContentSection
        contentClassName="lg:max-w-2xl"
        description="Update your profile information. Your email cannot be changed for security reasons."
        title="Profile"
      >
        <ProfileForm errors={dict.errors.action} user={session!.user} />
      </ContentSection>
    </>
  );
}
