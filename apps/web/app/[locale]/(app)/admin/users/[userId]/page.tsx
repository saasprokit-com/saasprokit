import { SetBreadcrumbs } from "@repo/design-system/components/layout/breadcrumb-context";
import { ContentSection } from "@repo/design-system/components/layout/content-section";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/design-system/components/ui/avatar";
import { Badge } from "@repo/design-system/components/ui/badge";
import {
  Card,
  CardContent,
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
import { getDictionary } from "@repo/internationalization";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminArea } from "@/lib/auth/admin";
import { adminRoutes } from "@/lib/routes";
import { RevokeSessionsButton } from "../components/revoke-sessions-button";
import { getAdminUserDetail } from "../queries";

interface AdminUserDetailPageProps {
  params: Promise<{ locale: string; userId: string }>;
}

export default async function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps) {
  const [ctx, { locale, userId }] = await Promise.all([
    requireAdminArea(),
    params,
  ]);
  if (!ctx.isAdmin) {
    notFound();
  }

  const [dict, user] = await Promise.all([
    getDictionary(locale),
    getAdminUserDetail(userId),
  ]);

  if (!user) {
    notFound();
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  return (
    <>
      <SetBreadcrumbs
        items={[
          { label: "Admin", href: adminRoutes.dashboard() },
          { label: "Users", href: adminRoutes.users() },
          { label: user.name || user.email },
        ]}
      />
      <ContentSection description={user.email} title={user.name || user.email}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-medium text-sm">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage
                    alt={user.name ?? ""}
                    src={user.image ?? undefined}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{user.name || "—"}</span>
                  <span className="text-muted-foreground text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
              <dl className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Role</dt>
                  <dd>
                    <Badge className="capitalize" variant="outline">
                      {user.role || "user"}
                    </Badge>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Joined</dt>
                  <dd>{new Date(user.createdAt).toLocaleDateString()}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Last active</dt>
                  <dd>
                    {user.lastActiveAt
                      ? formatDistanceToNow(new Date(user.lastActiveAt), {
                          addSuffix: true,
                        })
                      : "Never"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-medium text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Account</span>
                {user.banned ? (
                  <Badge variant="destructive">Banned</Badge>
                ) : (
                  <Badge variant="outline">Active</Badge>
                )}
              </div>
              {user.banned && (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Reason</span>
                    <span className="text-right">
                      {user.banReason || "No reason provided"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Expires</span>
                    <span>
                      {user.banExpires
                        ? formatDistanceToNow(new Date(user.banExpires), {
                            addSuffix: true,
                          })
                        : "Permanent"}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-medium text-sm">Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email verified</span>
                {user.emailVerified ? (
                  <Badge variant="outline">Verified</Badge>
                ) : (
                  <Badge variant="secondary">Unverified</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Two-factor auth</span>
                {user.twoFactorEnabled ? (
                  <Badge variant="outline">Enabled</Badge>
                ) : (
                  <Badge variant="secondary">Disabled</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Active sessions</h2>
            <RevokeSessionsButton
              errors={dict.errors.action}
              user={{ id: user.id, name: user.name, email: user.email }}
            />
          </div>
          {user.sessions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active sessions.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Started</TableHead>
                    <TableHead>IP address</TableHead>
                    <TableHead>Device</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          {formatDistanceToNow(new Date(session.createdAt), {
                            addSuffix: true,
                          })}
                          {session.impersonatedBy && (
                            <Badge className="text-xs" variant="secondary">
                              Impersonated
                            </Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {session.ipAddress || "—"}
                      </TableCell>
                      <TableCell className="max-w-[320px] truncate text-muted-foreground">
                        {session.userAgent || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-lg">Organizations</h2>
          {user.members.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Not a member of any organization.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {user.members.map((member) => (
                <li
                  className="flex items-center justify-between p-3"
                  key={member.organization.id}
                >
                  <Link
                    className="font-medium hover:underline"
                    href={adminRoutes.organization(member.organization.id)}
                  >
                    {member.organization.name}
                  </Link>
                  <div className="flex items-center gap-3 text-sm">
                    <Badge className="capitalize" variant="outline">
                      {member.role}
                    </Badge>
                    <span className="text-muted-foreground">
                      Joined {new Date(member.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </ContentSection>
    </>
  );
}
