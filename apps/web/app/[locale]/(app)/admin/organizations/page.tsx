import { TableSkeleton } from "@repo/design-system/components/data-table/table-skeleton";
import { SetBreadcrumbs } from "@repo/design-system/components/layout/breadcrumb-context";
import { ContentSection } from "@repo/design-system/components/layout/content-section";
import { getDictionary } from "@repo/internationalization";
import { Suspense } from "react";
import { requireAdminArea } from "@/lib/auth/admin";
import { adminRoutes } from "@/lib/routes";
import { OrgsTable } from "./components/orgs-table";
import { getAdminOrgs } from "./queries";
import { orgsSearchParamsCache } from "./validations";

interface AdminOrganizationsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminOrganizationsPage({
  params,
  searchParams,
}: AdminOrganizationsPageProps) {
  // Both admin and moderator may view organizations.
  const [ctx, { locale }, resolvedSearchParams] = await Promise.all([
    requireAdminArea(),
    params,
    searchParams,
  ]);
  const dict = await getDictionary(locale);

  const parsedParams = orgsSearchParamsCache.parse(resolvedSearchParams);
  const orgsPromise = getAdminOrgs(parsedParams);

  return (
    <>
      <SetBreadcrumbs
        items={[
          { label: "Admin", href: adminRoutes.dashboard() },
          { label: "Organizations" },
        ]}
      />
      <ContentSection
        description="Manage all organizations on the platform"
        title="Organizations"
      >
        <Suspense fallback={<TableSkeleton />}>
          <OrgsTable
            errors={dict.errors.action}
            isAdmin={ctx.isAdmin}
            orgsPromise={orgsPromise}
          />
        </Suspense>
      </ContentSection>
    </>
  );
}
