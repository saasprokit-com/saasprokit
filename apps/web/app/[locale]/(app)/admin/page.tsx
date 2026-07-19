import { SetBreadcrumbs } from "@repo/design-system/components/layout/breadcrumb-context";
import { ContentSection } from "@repo/design-system/components/layout/content-section";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import {
  PLAN_DISPLAY_NAMES,
  PLAN_ORDER,
  type PlanName,
} from "@repo/utils/payment";
import { requireAdminArea } from "@/lib/auth/admin";
import { getAdminKpis } from "./queries";

interface AdminKpiCard {
  hint: string;
  title: string;
  value: number | string;
}

export default async function AdminDashboardPage() {
  const ctx = await requireAdminArea();
  const kpis = await getAdminKpis({ includeUserStats: ctx.isAdmin });

  const planCounts = new Map(
    kpis.subscriptionsByPlan.map((row) => [row.plan, row.count])
  );

  const cards: AdminKpiCard[] = [];
  if (kpis.totalUsers !== null) {
    cards.push(
      { title: "Total users", value: kpis.totalUsers, hint: "All accounts" },
      {
        title: "New users",
        value: kpis.newUsers30d ?? 0,
        hint: "Last 30 days",
      },
      {
        title: "Banned users",
        value: kpis.bannedUsers ?? 0,
        hint: "Suspended accounts",
      }
    );
  }
  cards.push({
    title: "Organizations",
    value: kpis.totalOrgs,
    hint: "All organizations",
  });

  return (
    <>
      <SetBreadcrumbs items={[{ label: "Admin" }]} />
      <ContentSection description="Platform overview" title="Admin Dashboard">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{card.value}</div>
                <p className="text-muted-foreground text-xs">{card.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PLAN_ORDER.map((plan: PlanName) => (
            <Card key={plan}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  {PLAN_DISPLAY_NAMES[plan]} subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {planCounts.get(plan) ?? 0}
                </div>
                <p className="text-muted-foreground text-xs">
                  Active subscriptions
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </ContentSection>
    </>
  );
}
