"use client";

import type { ChartConfig } from "@repo/design-system/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@repo/design-system/components/ui/chart";
import { use } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { type DailyCount, formatDayLabel } from "@/lib/analytics/buckets";

interface CountBarChartProps {
  dataPromise: Promise<DailyCount[]>;
  label: string;
}

const BAR_RADIUS = 4;
const MIN_TICK_GAP = 24;

export function CountBarChart({ dataPromise, label }: CountBarChartProps) {
  const data = use(dataPromise);
  const config = {
    count: { label, color: "var(--chart-1)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer className="aspect-auto h-55 w-full" config={config}>
      <BarChart accessibilityLayer data={data} margin={{ left: -20, right: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="day"
          minTickGap={MIN_TICK_GAP}
          tickFormatter={formatDayLabel}
          tickLine={false}
          tickMargin={8}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tickMargin={8}
          width={48}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) => formatDayLabel(String(value))}
            />
          }
          cursor={false}
        />
        <Bar dataKey="count" fill="var(--color-count)" radius={BAR_RADIUS} />
      </BarChart>
    </ChartContainer>
  );
}
