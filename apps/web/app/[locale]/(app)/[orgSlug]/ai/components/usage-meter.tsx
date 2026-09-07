import { Progress } from "@repo/design-system/components/ui/progress";
import { UNLIMITED } from "@repo/utils/payment";
import type { AiQuotaStatus } from "@/lib/ai/queries";

const PERCENT = 100;

interface UsageMeterProps {
  quota: AiQuotaStatus;
}

interface MeterRowProps {
  label: string;
  max: number;
  used: number;
}

function MeterRow({ label, used, max }: MeterRowProps) {
  const unlimited = max === UNLIMITED;
  const value = unlimited ? 0 : Math.min(PERCENT, (used / max) * PERCENT);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span>
          {used.toLocaleString()} /{" "}
          {unlimited ? "Unlimited" : max.toLocaleString()}
        </span>
      </div>
      <Progress value={value} />
    </div>
  );
}

export function UsageMeter({ quota }: UsageMeterProps) {
  return (
    <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
      <MeterRow
        label="Tokens this month"
        max={quota.limits.maxAiTokensPerMonth}
        used={quota.usage.totalTokens}
      />
      <MeterRow
        label="Images this month"
        max={quota.limits.maxAiImagesPerMonth}
        used={quota.usage.imageCount}
      />
    </div>
  );
}
