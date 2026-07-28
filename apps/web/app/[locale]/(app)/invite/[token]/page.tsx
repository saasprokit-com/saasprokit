import { Badge } from "@repo/design-system/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { formatDate } from "@repo/design-system/lib/date";
import { getDictionary } from "@repo/internationalization";
import {
  AlertCircle,
  Building2,
  Clock,
  Link2,
  User,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "@/lib/auth/auth";
import { PAGE_ROUTES } from "@/lib/routes";
import { getInviteLinkDetails } from "../queries";
import { JoinButton } from "./join-button";

interface InviteLinkPageProps {
  params: Promise<{ locale: string; token: string }>;
}

export default async function InviteLinkPage({ params }: InviteLinkPageProps) {
  const { locale, token } = await params;

  // Get invite link details
  const inviteLink = await getInviteLinkDetails(token);

  if (!inviteLink) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Invalid Invite Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This invite link is invalid or doesn't exist.
            </p>
          </CardContent>
          <CardFooter>
            <Link className="text-primary text-sm hover:underline" href="/">
              Go to homepage
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Check if link is active
  if (!inviteLink.isActive) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Link Revoked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This invite link has been revoked by an administrator.
            </p>
          </CardContent>
          <CardFooter>
            <Link className="text-primary text-sm hover:underline" href="/">
              Go to homepage
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Check expiry
  const isExpired =
    inviteLink.expiresAt && new Date(inviteLink.expiresAt) < new Date();

  if (isExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Link Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This invite link has expired. Please ask for a new link from the
              organization administrator.
            </p>
          </CardContent>
          <CardFooter>
            <Link className="text-primary text-sm hover:underline" href="/">
              Go to homepage
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Check max uses
  const isMaxedOut =
    inviteLink.maxUses !== null && inviteLink.usedCount >= inviteLink.maxUses;

  if (isMaxedOut) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Link Usage Limit Reached
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This invite link has reached its maximum number of uses. Please
              ask for a new link from the organization administrator.
            </p>
          </CardContent>
          <CardFooter>
            <Link className="text-primary text-sm hover:underline" href="/">
              Go to homepage
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Check if user is logged in (no redirect — guests see "sign in to join")
  const [session, dict] = await Promise.all([
    getServerSession(),
    getDictionary(locale),
  ]);

  // Calculate remaining uses
  const remainingUses =
    inviteLink.maxUses === null
      ? null
      : inviteLink.maxUses - inviteLink.usedCount;

  // Show the invite link details
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            {inviteLink.organization.logo ? (
              <Image
                alt={inviteLink.organization.name}
                className="rounded-full object-cover"
                height={48}
                src={inviteLink.organization.logo}
                width={48}
              />
            ) : (
              <Building2 className="h-8 w-8 text-primary" />
            )}
          </div>
          <CardTitle>Join {inviteLink.organization.name}</CardTitle>
          <CardDescription>
            You've been invited to join this organization
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold text-lg">
              {inviteLink.organization.name}
            </h3>
            <div className="mt-2 flex flex-col gap-2 text-muted-foreground text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>
                  Role:{" "}
                  <Badge className="capitalize" variant="outline">
                    {inviteLink.role}
                  </Badge>
                </span>
              </div>
              {inviteLink.createdBy?.name && (
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  <span>Shared by: {inviteLink.createdBy.name}</span>
                </div>
              )}
              {inviteLink.expiresAt && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Expires: {formatDate(inviteLink.expiresAt)}</span>
                </div>
              )}
              {remainingUses !== null && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>
                    {remainingUses} spot{remainingUses === 1 ? "" : "s"}{" "}
                    remaining
                  </span>
                </div>
              )}
            </div>
          </div>

          {!session?.user && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
              <p className="text-amber-800 text-sm dark:text-amber-200">
                You need to sign in or create an account to join this
                organization.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          {session?.user ? (
            <JoinButton errors={dict.errors.action} token={token} />
          ) : (
            <div className="flex w-full flex-col gap-2">
              <Link
                className="w-full rounded-md bg-primary px-4 py-2 text-center text-primary-foreground text-sm hover:bg-primary/90"
                href={`${PAGE_ROUTES.SIGN_IN}?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}
              >
                Sign in to join
              </Link>
              <Link
                className="w-full rounded-md border border-input bg-background px-4 py-2 text-center text-sm hover:bg-accent"
                href={`${PAGE_ROUTES.SIGN_UP}?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}
              >
                Create an account
              </Link>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
