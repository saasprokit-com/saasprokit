import type { ReactNode } from "react";
import { requireAuth } from "@/lib/auth/auth";

interface AppLayoutProps {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string }>;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  await requireAuth();

  return <>{children}</>;
}
