import { Stamp } from "@repo/design-system/components/molecules/stamp/stamp";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "molecules/stamp/Stamp",
  component: Stamp,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Stamp>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default stamp using the primary theme color.
 */
export const Default: Story = {
  args: {
    children: "Acme",
  },
};

/**
 * Stamp with a custom accent color.
 */
export const CustomColor: Story = {
  args: {
    children: "Beta",
    color: "oklch(0.55 0.2 260)",
  },
};

/**
 * Stamp with larger corner brackets for a bolder frame.
 */
export const LargeBrackets: Story = {
  args: {
    children: "New in v2.0",
    bracketSize: "0.6lh",
  },
};

/**
 * Stamp with thicker bracket strokes.
 */
export const ThickBrackets: Story = {
  args: {
    children: "Enterprise",
    bracketWidth: "4px",
  },
};

/**
 * Stamp wrapping larger content, as used by the Logo component.
 */
export const WithLargeText: Story = {
  args: {
    children: (
      <span className="inline-flex items-center gap-2 font-bold text-2xl">
        Acme Cloud
      </span>
    ),
  },
};
