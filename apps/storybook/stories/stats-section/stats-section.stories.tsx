import { StatsSection } from "@repo/design-system/components/blocks/stats-section/stats-section";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "blocks/stats-section/StatsSection",
  component: StatsSection,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof StatsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default stats section with four key metrics.
 */
export const Default: Story = {
  args: {
    stats: [
      {
        value: "10K+",
        label: "Active teams",
        description: "Building products on Acme",
      },
      {
        value: "99.99%",
        label: "Uptime",
        description: "Measured over the last 12 months",
      },
      {
        value: "150+",
        label: "Countries",
        description: "With active Acme customers",
      },
      {
        value: "4.8/5",
        label: "Customer rating",
        description: "Across 2,300+ reviews",
      },
    ],
  },
};

/**
 * Stats section with two metrics, rendered in a two-column grid.
 */
export const TwoStats: Story = {
  args: {
    stats: [
      {
        value: "$2.5B",
        label: "Processed annually",
        description: "In customer transactions",
      },
      {
        value: "500ms",
        label: "Median response time",
        description: "Across all API endpoints",
      },
    ],
  },
};

/**
 * Stats section focused on growth metrics.
 */
export const GrowthMetrics: Story = {
  args: {
    stats: [
      {
        value: "3x",
        label: "Faster shipping",
        description: "Average release cadence improvement",
      },
      {
        value: "40%",
        label: "Cost reduction",
        description: "Compared to in-house tooling",
      },
      {
        value: "2 weeks",
        label: "Time to launch",
        description: "From signup to production",
      },
      {
        value: "24/7",
        label: "Support",
        description: "Global coverage on every plan",
      },
    ],
  },
};
