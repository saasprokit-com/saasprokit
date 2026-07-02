import type { ReactNode } from "react";
import { checkOrgPermission } from "@/lib/auth/auth";

interface PermissionGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  organizationId: string;
  permissions: Record<string, string[]>;
}

/**
 * Server Component that conditionally renders children based on the current
 * user's organization-scoped permissions. Renders `fallback` (or nothing)
 * when the user is unauthenticated or lacks the required permissions.
 *
 * Permissions follow the better-auth shape: a map of resource -> actions,
 * where the user must hold every listed action on every listed resource.
 */
export async function PermissionGate({
  organizationId,
  permissions,
  fallback = null,
  children,
}: PermissionGateProps) {
  const result = await checkOrgPermission(organizationId, permissions);
  return result ? children : fallback;
}
