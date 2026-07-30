import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getServerSession } from "@/lib/auth/auth";
import { PAGE_ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AuthLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  // DB-verified, unlike the middleware's cookie-presence check: a revoked
  // session (password change, ban) must land on sign-in, not bounce to /org.
  const session = await getServerSession();
  if (session) {
    redirect(PAGE_ROUTES.ORG);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      {children}
    </main>
  );
}
