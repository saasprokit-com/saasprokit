import { canOrg } from "@repo/auth/permissions";
import type { ReactNode } from "react";

interface OrgPermissionGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  permissions: Record<string, string[]>;
  role: string;
}

export function OrgPermissionGate({
  role,
  permissions,
  fallback = null,
  children,
}: OrgPermissionGateProps) {
  return canOrg(role, permissions) ? children : fallback;
}
