import { SetBreadcrumbs } from "@repo/design-system/components/layout/breadcrumb-context";
import { ContentSection } from "@repo/design-system/components/layout/content-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { getActiveOrganization } from "@/servers/organization/queries";
import { getOrgDashboardData } from "./queries";

interface OrgDashboardPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgDashboardPage({
  params,
}: OrgDashboardPageProps) {
  const { orgSlug } = await params;
  const orgContext = await getActiveOrganization(orgSlug);

  const { memberCount, organization } = await getOrgDashboardData(
    orgContext.organizationId
  );

  return (
    <>
      <SetBreadcrumbs items={[{ label: organization?.name ?? "Dashboard" }]} />
      <ContentSection
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
                  ? new Date(organization.createdAt).toLocaleDateString()
                  : "N/A"}
              </div>
              <p className="text-muted-foreground text-xs">Organization age</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-muted-foreground text-sm">
                Use the sidebar to navigate to different sections of your
                organization.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates in your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                No recent activity to display.
              </p>
            </CardContent>
          </Card>
        </div>
      </ContentSection>
    </>
  );
}
