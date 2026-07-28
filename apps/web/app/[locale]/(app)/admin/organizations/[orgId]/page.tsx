import { stripeCustomerDashboardUrl } from "@repo/auth/stripe-client";
import { SetBreadcrumbs } from "@repo/design-system/components/layout/breadcrumb-context";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/design-system/components/ui/avatar";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { formatDate } from "@repo/design-system/lib/date";
import { PLAN_DISPLAY_NAMES, type PlanName } from "@repo/utils/payment";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminArea } from "@/lib/auth/admin";
import { adminRoutes } from "@/lib/routes";
import { getAdminOrgDetail } from "../queries";

interface AdminOrganizationDetailPageProps {
  params: Promise<{ locale: string; orgId: string }>;
}

function initialsOf(value: string): string {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function AdminOrganizationDetailPage({
  params,
}: AdminOrganizationDetailPageProps) {
  const [ctx, { orgId }] = await Promise.all([requireAdminArea(), params]);
  const org = await getAdminOrgDetail(orgId);

  if (!org) {
    notFound();
  }

  const subscription = org.subscriptions[0] ?? null;
  const stripeCustomerId =
    subscription?.stripeCustomerId ?? org.stripeCustomerId ?? null;

  return (
    <div className="space-y-6">
      <SetBreadcrumbs
        items={[
          { label: "Admin", href: adminRoutes.dashboard() },
          { label: "Organizations", href: adminRoutes.organizations() },
          { label: org.name },
        ]}
      />

      {/* Identity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="size-12">
              <AvatarImage alt={org.name} src={org.logo ?? undefined} />
              <AvatarFallback>{initialsOf(org.name)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle>{org.name}</CardTitle>
              <CardDescription className="font-mono">
                {org.slug}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Members</dt>
              <dd className="font-medium">{org.members.length}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">{formatDate(org.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Organization ID</dt>
              <dd className="font-mono text-xs">{org.id}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Billing details for this organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription ? (
            <>
              <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Plan</dt>
                  <dd className="font-medium">
                    {PLAN_DISPLAY_NAMES[subscription.plan as PlanName] ??
                      subscription.plan}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <Badge className="capitalize" variant="secondary">
                      {subscription.status ?? "unknown"}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Seats</dt>
                  <dd className="font-medium">{subscription.seats ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Current period</dt>
                  <dd className="font-medium">
                    {formatDate(subscription.periodStart) || "N/A"} –{" "}
                    {formatDate(subscription.periodEnd) || "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    Cancels at period end
                  </dt>
                  <dd className="font-medium">
                    {subscription.cancelAtPeriodEnd ? "Yes" : "No"}
                  </dd>
                </div>
              </dl>
              {stripeCustomerId && (
                <Button asChild size="sm" variant="outline">
                  <a
                    href={stripeCustomerDashboardUrl(stripeCustomerId)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    View customer in Stripe
                    <ExternalLink className="ml-2 size-4" />
                  </a>
                </Button>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              No subscription on record.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            {org.members.length} member{org.members.length === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {org.members.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {org.members.map((member) => {
                  const displayName =
                    member.user.name || member.user.email.split("@")[0];
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarImage
                              alt={member.user.name ?? ""}
                              src={member.user.image ?? undefined}
                            />
                            <AvatarFallback>
                              {initialsOf(
                                member.user.name || member.user.email
                              )}
                            </AvatarFallback>
                          </Avatar>
                          {ctx.isAdmin ? (
                            <Link
                              className="font-medium hover:underline"
                              href={adminRoutes.user(member.user.id)}
                            >
                              {displayName}
                            </Link>
                          ) : (
                            <span className="font-medium">{displayName}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.user.email}
                      </TableCell>
                      <TableCell>
                        <Badge className="capitalize" variant="outline">
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(member.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">No members.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
