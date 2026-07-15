import { PageSkeleton } from "@repo/design-system/components/layout/page-skeleton";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "layout/PageSkeleton",
  component: PageSkeleton,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof PageSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default content-area fallback: mirrors <ContentSection> with three body blocks.
 */
export const Default: Story = {};

/**
 * A denser page can ask for more body blocks.
 */
export const ManyRows: Story = {
  args: {
    rows: 6,
  },
};

/**
 * A single body block, for short pages.
 */
export const SingleRow: Story = {
  args: {
    rows: 1,
  },
};
