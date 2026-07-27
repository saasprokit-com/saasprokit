import { getOrgUsageStats } from "@/lib/billing/subscription-queries";
import { formatStorage } from "@repo/auth/helpers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Progress } from "@repo/design-system/components/ui/progress";
import { HardDrive, Users } from "lucide-react";

interface UsageStatsType {
  organizationId: string;
} 

export async function UsageStats({
  organizationId
}: UsageStatsType) {
  const usageStats = await getOrgUsageStats(organizationId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage</CardTitle>
        <CardDescription>
          Your current resource usage on the {usageStats.members.current} plan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Team Members</span>
            </div>
            <span className="text-muted-foreground text-sm">
              {usageStats.members.current} /{" "}
              {usageStats?.members?.limit ? "Unlimited" : usageStats.members.limit}
            </span>
          </div>
          {!usageStats?.members?.limit && (
            <Progress className="h-2" value={usageStats.members.percentage} />
          )}
          {usageStats?.members?.limit && (
            <div className="rounded bg-muted px-3 py-2 text-muted-foreground text-sm">
              Unlimited team members on your plan
            </div>
          )}
        </div>

        {/* Storage Usage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Storage</span>
            </div>
            <span className="text-muted-foreground text-sm">
              {formatStorage(usageStats.storage.currentMB)} /{" "}
              {usageStats.storage?.limitMB
                ? "Unlimited"
                : formatStorage(usageStats.storage.limitMB)}
            </span>
          </div>
          {!usageStats.storage?.limitMB && (
            <Progress className="h-2" value={usageStats.storage.percentage} />
          )}
          {usageStats.storage?.limitMB && (
            <div className="rounded bg-muted px-3 py-2 text-muted-foreground text-sm">
              Unlimited storage on your plan
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
