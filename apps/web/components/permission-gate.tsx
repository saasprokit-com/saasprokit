import { canOrg } from "@repo/auth/permissions";
import type { ReactNode } from "react";

interface PermissionGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  permissions: Record<string, string[]>;
  role: string;
}

export function PermissionGate({
  role,
  permissions,
  fallback = null,
  children,
}: PermissionGateProps) {
  return canOrg(role, permissions) ? children : fallback;
}
