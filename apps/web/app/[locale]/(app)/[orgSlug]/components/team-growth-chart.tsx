"use client";

import type { ChartConfig } from "@repo/design-system/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@repo/design-system/components/ui/chart";
import { use } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { type DailyCount, formatDayLabel } from "@/lib/analytics/buckets";

interface TeamGrowthChartProps {
  dataPromise: Promise<DailyCount[]>;
}

const MIN_TICK_GAP = 24;
const STROKE_WIDTH = 2;
const FILL_TOP_OPACITY = 0.7;
const FILL_BOTTOM_OPACITY = 0.05;

const config = {
  count: { label: "Members", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function TeamGrowthChart({ dataPromise }: TeamGrowthChartProps) {
  const data = use(dataPromise);

  return (
    <ChartContainer className="aspect-auto h-55 w-full" config={config}>
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{ left: -20, right: 4 }}
      >
        <defs>
          <linearGradient id="team-growth-fill" x1="0" x2="0" y1="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-count)"
              stopOpacity={FILL_TOP_OPACITY}
            />
            <stop
              offset="95%"
              stopColor="var(--color-count)"
              stopOpacity={FILL_BOTTOM_OPACITY}
            />
          </linearGradient>
        </defs>
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
        />
        <Area
          dataKey="count"
          fill="url(#team-growth-fill)"
          stroke="var(--color-count)"
          strokeWidth={STROKE_WIDTH}
          type="monotone"
        />
      </AreaChart>
    </ChartContainer>
  );
}
