import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireAuth } from "@/lib/auth/auth";
import { PAGE_ROUTES } from "@/lib/routes";
import { getUserMembershipCount } from "./queries";

interface AppLayoutProps {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string }>;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await requireAuth();

  // Check if user has any org memberships (cheap indexed count query)
  const membershipCount = await getUserMembershipCount(session.user.id);

  if (membershipCount === 0) {
    redirect(PAGE_ROUTES.ORG);
  }

  return <>{children}</>;
}
