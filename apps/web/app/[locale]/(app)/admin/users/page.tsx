import { TableSkeleton } from "@repo/design-system/components/data-table/table-skeleton";
import { SetBreadcrumbs } from "@repo/design-system/components/layout/breadcrumb-context";
import { ContentSection } from "@repo/design-system/components/layout/content-section";
import { getDictionary } from "@repo/internationalization";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdminArea } from "@/lib/auth/admin";
import { adminRoutes } from "@/lib/routes";
import { UsersTable } from "./components/users-table";
import { getAdminUsers } from "./queries";
import { usersSearchParamsCache } from "./validations";

interface AdminUsersPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminUsersPage({
  params,
  searchParams,
}: AdminUsersPageProps) {
  const ctx = await requireAdminArea();
  if (!ctx.isAdmin) {
    notFound();
  }

  const [{ locale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const dict = await getDictionary(locale);

  const parsedParams = usersSearchParamsCache.parse(resolvedSearchParams);

  // Start the query without awaiting so the Suspense boundary can stream.
  const usersPromise = getAdminUsers(parsedParams);

  return (
    <>
      <SetBreadcrumbs
        items={[
          { label: "Admin", href: adminRoutes.dashboard() },
          { label: "Users" },
        ]}
      />
      <ContentSection
        description="Search, inspect, and manage platform user accounts"
        title="Users"
      >
        <Suspense fallback={<TableSkeleton />}>
          <UsersTable
            currentUserId={ctx.userId}
            errors={dict.errors.action}
            usersPromise={usersPromise}
          />
        </Suspense>
      </ContentSection>
    </>
  );
}
