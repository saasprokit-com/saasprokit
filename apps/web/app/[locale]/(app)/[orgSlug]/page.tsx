import { SetBreadcrumbs } from "@repo/design-system/components/layout/breadcrumb-context";
import { ContentSection } from "@repo/design-system/components/layout/content-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { formatDate } from "@repo/design-system/lib/date";
import { Suspense } from "react";
import { CountBarChart } from "@/components/count-bar-chart";
import { DashboardRangeTabs } from "@/components/dashboard-range-tabs";
import { getActiveOrganization } from "@/lib/organization/queries";
import { dashboardSearchParamsCache } from "@/lib/parsers";
import { TeamGrowthChart } from "./components/team-growth-chart";
import {
  getOrgActivityPlaceholder,
  getOrgDashboardData,
  getOrgMemberGrowth,
} from "./queries";

interface OrgDashboardPageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function OrgDashboardPage({
  params,
  searchParams,
}: OrgDashboardPageProps) {
  const [{ orgSlug }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const { range } = dashboardSearchParamsCache.parse(resolvedSearchParams);
  const orgContext = await getActiveOrganization(orgSlug);

  const growthPromise = getOrgMemberGrowth({
    organizationId: orgContext.organizationId,
    range,
  });
  const activityPromise = getOrgActivityPlaceholder(range);

  const { memberCount, organization } = await getOrgDashboardData(
    orgContext.organizationId
  );

  return (
    <>
      <SetBreadcrumbs items={[{ label: organization?.name ?? "Dashboard" }]} />
      <ContentSection
        action={<DashboardRangeTabs />}
        description="Organization Dashboard"
        title={organization?.name ?? "Dashboard"}
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{memberCount}</div>
              <p className="text-muted-foreground text-xs">
                Active team members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">Your Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl capitalize">
                {orgContext.role.toLowerCase()}
              </div>
              <p className="text-muted-foreground text-xs">
                In this organization
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">Slug</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold font-mono text-2xl">{orgSlug}</div>
              <p className="text-muted-foreground text-xs">Organization URL</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">Created</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {organization?.createdAt
                  ? formatDate(organization.createdAt)
                  : "N/A"}
              </div>
              <p className="text-muted-foreground text-xs">Organization age</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Team growth</CardTitle>
              <CardDescription>
                Total members over the selected range
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-55 w-full" />}>
                <TeamGrowthChart dataPromise={growthPromise} />
              </Suspense>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team activity</CardTitle>
              <CardDescription>
                Sample data — not wired to a live source
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-55 w-full" />}>
                <CountBarChart dataPromise={activityPromise} label="Events" />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </ContentSection>
    </>
  );
}
