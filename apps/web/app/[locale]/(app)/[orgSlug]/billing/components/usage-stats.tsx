import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Progress } from "@repo/design-system/components/ui/progress";
import { formatStorage, UNLIMITED } from "@repo/utils/payment";
import { HardDrive, Users } from "lucide-react";
import {
  getCurrentPlanForOrg,
  getOrgUsageStats,
} from "@/lib/billing/subscription-queries";

interface UsageStatsType {
  organizationId: string;
}

export async function UsageStats({ organizationId }: UsageStatsType) {
  const [usageStats, planName] = await Promise.all([
    getOrgUsageStats(organizationId),
    getCurrentPlanForOrg(organizationId),
  ]);
  const membersUnlimited = usageStats.members.limit === UNLIMITED;
  const storageUnlimited = usageStats.storage.limitMB === UNLIMITED;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage</CardTitle>
        <CardDescription>
          Your current resource usage on the {planName} plan
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
              {membersUnlimited ? "Unlimited" : usageStats.members.limit}
            </span>
          </div>
          {membersUnlimited ? (
            <div className="rounded bg-muted px-3 py-2 text-muted-foreground text-sm">
              Unlimited team members on your plan
            </div>
          ) : (
            <Progress className="h-2" value={usageStats.members.percentage} />
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
              {storageUnlimited
                ? "Unlimited"
                : formatStorage(usageStats.storage.limitMB)}
            </span>
          </div>
          {storageUnlimited ? (
            <div className="rounded bg-muted px-3 py-2 text-muted-foreground text-sm">
              Unlimited storage on your plan
            </div>
          ) : (
            <Progress className="h-2" value={usageStats.storage.percentage} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
