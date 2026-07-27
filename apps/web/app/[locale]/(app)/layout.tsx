import type { ReactNode } from "react";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { getServerSession } from "@/lib/auth/auth";

interface AppLayoutProps {
  readonly children: ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await getServerSession();
  const impersonating = Boolean(session?.session.impersonatedBy);

  return (
    <>
      {impersonating && session ? (
        <ImpersonationBanner
          email={session.user.email}
          name={session.user.name}
        />
      ) : null}
      {children}
    </>
  );
}
