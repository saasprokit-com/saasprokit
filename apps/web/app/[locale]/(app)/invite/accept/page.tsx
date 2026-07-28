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
import type { ActionErrorMessages } from "@repo/internationalization";
import { getDictionary } from "@repo/internationalization";
import { INVITATION_STATUS } from "@repo/utils/organization";
import { AlertCircle, Building2, Clock, Mail, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/auth";
import { PAGE_ROUTES } from "@/lib/routes";

import { getInvitationDetails } from "../queries";
import { AcceptInvitationButton } from "./accept-button";

type SessionResult = Awaited<ReturnType<typeof getServerSession>>;

interface InvitationFooterProps {
  errors: ActionErrorMessages;
  invitationEmail: string;
  invitationId: string;
  session: SessionResult;
}

function InvitationFooter({
  session,
  invitationId,
  invitationEmail,
  errors,
}: InvitationFooterProps) {
  const userEmail = session?.user?.email;
  const emailMatches =
    userEmail?.toLowerCase() === invitationEmail.toLowerCase();

  if (!session?.user) {
    return (
      <div className="flex w-full flex-col gap-2">
        <Link
          className="w-full rounded-md bg-primary px-4 py-2 text-center text-primary-foreground text-sm hover:bg-primary/90"
          href={`${PAGE_ROUTES.SIGN_IN}?callbackUrl=${encodeURIComponent(`/invite/accept?token=${invitationId}`)}`}
        >
          Sign in to accept
        </Link>
        <Link
          className="w-full rounded-md border border-input bg-background px-4 py-2 text-center text-sm hover:bg-accent"
          href={`${PAGE_ROUTES.SIGN_UP}?callbackUrl=${encodeURIComponent(`/invite/accept?token=${invitationId}`)}`}
        >
          Create account to accept
        </Link>
      </div>
    );
  }

  if (emailMatches) {
    return (
      <AcceptInvitationButton errors={errors} invitationId={invitationId} />
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-destructive text-sm">
          You're signed in as {userEmail}, but this invitation was sent to{" "}
          {invitationEmail}. Please sign in with the correct account.
        </p>
      </div>
      <Link
        className="block w-full rounded-md border border-input bg-background px-4 py-2 text-center text-sm hover:bg-accent"
        href={`${PAGE_ROUTES.SIGN_IN}?callbackUrl=${encodeURIComponent(`/invite/accept?token=${invitationId}`)}`}
      >
        Sign in with different account
      </Link>
    </div>
  );
}

interface AcceptInvitePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInvitePage({
  params,
  searchParams,
}: AcceptInvitePageProps) {
  const [{ locale }, { token: invitationId }] = await Promise.all([
    params,
    searchParams,
  ]);

  if (!invitationId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This invitation link is invalid or missing the invitation ID.
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

  // Get invitation details
  const invitation = await getInvitationDetails(invitationId);

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Invitation Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This invitation may have been cancelled or doesn't exist.
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
    invitation.expiresAt && new Date(invitation.expiresAt) < new Date();

  // Check status
  const isAccepted = invitation.status === INVITATION_STATUS.ACCEPTED;
  const isCancelled = invitation.status === INVITATION_STATUS.CANCELED;

  if (isExpired || isCancelled) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {isExpired ? "Invitation Expired" : "Invitation Cancelled"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {isExpired
                ? "This invitation has expired. Please ask the organization admin to send a new invitation."
                : "This invitation has been cancelled by the organization admin."}
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

  // Check if user is logged in (no redirect — guests see "sign in to accept")
  const [session, dict] = await Promise.all([
    getServerSession(),
    getDictionary(locale),
  ]);

  // If already accepted, redirect to organization
  if (isAccepted) {
    redirect(`/${invitation.organization.slug}`);
  }

  // Show the invitation details
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            {invitation.organization.logo ? (
              <Image
                alt={invitation.organization.name}
                className="rounded-full object-cover"
                height={48}
                src={invitation.organization.logo}
                width={48}
              />
            ) : (
              <Building2 className="h-8 w-8 text-primary" />
            )}
          </div>
          <CardTitle>You're invited!</CardTitle>
          <CardDescription>
            {invitation.user.name} has invited you to join
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold text-lg">
              {invitation.organization.name}
            </h3>
            <div className="mt-2 flex flex-col gap-2 text-muted-foreground text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>Invited as: {invitation.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>
                  Role:{" "}
                  <Badge className="capitalize" variant="outline">
                    {invitation.role || "member"}
                  </Badge>
                </span>
              </div>
              {invitation.expiresAt && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Expires: {formatDate(invitation.expiresAt)}</span>
                </div>
              )}
            </div>
          </div>

          {!session?.user && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
              <p className="text-amber-800 text-sm dark:text-amber-200">
                You need to sign in or create an account to accept this
                invitation.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <InvitationFooter
            errors={dict.errors.action}
            invitationEmail={invitation.email}
            invitationId={invitationId}
            session={session}
          />
        </CardFooter>
      </Card>
    </div>
  );
}
