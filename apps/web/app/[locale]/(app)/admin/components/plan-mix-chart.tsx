"use client";

import type { ChartConfig } from "@repo/design-system/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@repo/design-system/components/ui/chart";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";

export interface PlanMixDatum {
  count: number;
  plan: string;
}

interface PlanMixChartProps {
  data: PlanMixDatum[];
}

const BAR_RADIUS = 4;
const LABEL_OFFSET = 8;
const CATEGORY_WIDTH = 88;

const config = {
  count: { label: "Subscriptions", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function PlanMixChart({ data }: PlanMixChartProps) {
  return (
    <ChartContainer className="aspect-auto h-55 w-full" config={config}>
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ right: 32 }}
      >
        <XAxis dataKey="count" hide type="number" />
        <YAxis
          axisLine={false}
          dataKey="plan"
          tickLine={false}
          tickMargin={8}
          type="category"
          width={CATEGORY_WIDTH}
        />
        <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
        <Bar dataKey="count" fill="var(--color-count)" radius={BAR_RADIUS}>
          <LabelList
            className="fill-foreground"
            dataKey="count"
            fontSize={12}
            offset={LABEL_OFFSET}
            position="right"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
