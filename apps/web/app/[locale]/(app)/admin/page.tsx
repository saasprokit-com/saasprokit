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
import {
  PLAN_DISPLAY_NAMES,
  PLAN_ORDER,
  type PlanName,
} from "@repo/utils/payment";
import { Suspense } from "react";
import { CountBarChart } from "@/components/count-bar-chart";
import { DashboardRangeTabs } from "@/components/dashboard-range-tabs";
import { requireAdminArea } from "@/lib/auth/admin";
import { dashboardSearchParamsCache } from "@/lib/parsers";
import { PlanMixChart } from "./components/plan-mix-chart";
import { getAdminKpis, getSignupTrend } from "./queries";

interface AdminKpiCard {
  hint: string;
  title: string;
  value: number | string;
}

interface AdminDashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminDashboardPage({
  searchParams,
}: AdminDashboardPageProps) {
  const ctx = await requireAdminArea();
  const { range } = dashboardSearchParamsCache.parse(await searchParams);
  const signupPromise = ctx.isAdmin ? getSignupTrend(range) : null;
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
  const planMix = PLAN_ORDER.map((plan: PlanName) => ({
    count: planCounts.get(plan) ?? 0,
    plan: PLAN_DISPLAY_NAMES[plan],
  }));

  cards.push({
    title: "Organizations",
    value: kpis.totalOrgs,
    hint: "All organizations",
  });

  return (
    <>
      <SetBreadcrumbs items={[{ label: "Admin" }]} />
      <ContentSection
        action={<DashboardRangeTabs />}
        description="Platform overview"
        title="Admin Dashboard"
      >
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

        <div className="grid gap-4 md:grid-cols-2">
          {signupPromise ? (
            <Card>
              <CardHeader>
                <CardTitle>New signups</CardTitle>
                <CardDescription>
                  Accounts created over the selected range
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-55 w-full" />}>
                  <CountBarChart dataPromise={signupPromise} label="Signups" />
                </Suspense>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Plan mix</CardTitle>
              <CardDescription>Active subscriptions by plan</CardDescription>
            </CardHeader>
            <CardContent>
              <PlanMixChart data={planMix} />
            </CardContent>
          </Card>
        </div>
      </ContentSection>
    </>
  );
}
