import type { ReactNode } from "react";
import { requireAuth } from "@/lib/auth/auth";
import { createDefaultWorkspace } from "@/lib/organization/personal-org";
import { getUserMembershipCount } from "./queries";

interface AppLayoutProps {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string }>;
}

/**
 * Root layout for authenticated (app) routes.
 * Ensures the user is signed in and has at least one organization.
 * If the user has no org memberships (e.g. first login after social sign-up),
 * a personal workspace is created automatically.
 */
export default async function AppLayout({ children, params }: AppLayoutProps) {
  await params;
  const session = await requireAuth();

  // Check if user has any org memberships (cheap indexed count query)
  const membershipCount = await getUserMembershipCount(session.user.id);

  if (membershipCount === 0) {
    // First authenticated page load with no org — create personal workspace
    await createDefaultWorkspace(
      session.user.id,
      session.user.name,
      session.user.email
    );
  }

  return <>{children}</>;
}
