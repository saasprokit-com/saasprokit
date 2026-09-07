import { DepsTable } from "@repo/design-system/components/blocks/deps-table/deps-table";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "blocks/deps-table/DepsTable",
  component: DepsTable,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof DepsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The dependency data is internal to the component; only `className` is
 * configurable. Default full-width rendering.
 */
export const Default: Story = {
  args: {},
};

/**
 * Constrained and centered via `className`, as it would appear inside a
 * marketing page container.
 */
export const Constrained: Story = {
  args: {
    className: "mx-auto my-16 max-w-5xl",
  },
};
