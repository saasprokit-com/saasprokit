import "server-only";

import { getPlanLimits } from "@repo/auth/plans";
import type { createRequestLogger } from "@repo/logger/log";
import { UNLIMITED } from "@repo/utils/payment";
import { BYTES_PER_MB } from "@repo/utils/storage";
import {
  getCurrentPlanForOrg,
  getOrgStorageUsage,
} from "@/lib/billing/subscription-queries";

export async function validateStorageQuota(
  organizationId: string,
  fileSizeBytes: number,
  logger: ReturnType<typeof createRequestLogger>
): Promise<{ valid: true } | { valid: false; error: string }> {
  const [usageMB, planName] = await Promise.all([
    getOrgStorageUsage(organizationId),
    getCurrentPlanForOrg(organizationId),
  ]);
  const { maxStorageMB } = getPlanLimits(planName);
  const fileMB = fileSizeBytes / BYTES_PER_MB;

  if (maxStorageMB === UNLIMITED || usageMB + fileMB <= maxStorageMB) {
    return { valid: true };
  }

  logger.warn("Storage quota exceeded", {
    organizationId,
    usageMB,
    fileMB,
    maxStorageMB,
  });
  return {
    valid: false,
    error: `Storage quota exceeded. You have used ${usageMB.toFixed(1)} MB of ${maxStorageMB} MB. Please upgrade your plan or delete unused files.`,
  };
}
