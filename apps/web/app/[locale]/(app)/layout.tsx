import type { ReactNode } from "react";

interface AppLayoutProps {
  readonly children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return <>{children}</>;
}
