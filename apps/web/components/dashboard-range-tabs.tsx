"use client";

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@repo/design-system/components/ui/toggle-group";
import { useQueryState } from "nuqs";
import { useTransition } from "react";
import {
  DASHBOARD_RANGES,
  type DashboardRange,
  dashboardRangeParser,
} from "@/lib/parsers";

const RANGE_LABELS: Record<DashboardRange, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
};

export function DashboardRangeTabs() {
  const [isPending, startTransition] = useTransition();
  const [range, setRange] = useQueryState(
    "range",
    dashboardRangeParser.withOptions({ shallow: false, startTransition })
  );

  return (
    <ToggleGroup
      aria-label="Chart date range"
      data-pending={isPending || undefined}
      onValueChange={(value) => {
        if (value) {
          setRange(value as DashboardRange);
        }
      }}
      size="sm"
      type="single"
      value={range}
      variant="outline"
    >
      {DASHBOARD_RANGES.map((option) => (
        <ToggleGroupItem key={option} value={option}>
          {RANGE_LABELS[option]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
