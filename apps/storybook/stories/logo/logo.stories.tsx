import { Logo } from "@repo/design-system/components/molecules/logo/logo";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Rocket, Zap } from "lucide-react";

const meta = {
  title: "molecules/logo/Logo",
  component: Logo,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default logo with brand text only.
 */
export const Default: Story = {
  args: {
    text: "Acme",
  },
};

/**
 * Logo with an icon next to the brand text.
 */
export const WithIcon: Story = {
  args: {
    icon: <Rocket size={24} />,
    text: "Acme",
  },
};

/**
 * Icon-only logo, useful for compact headers or favicon-style marks.
 */
export const IconOnly: Story = {
  args: {
    icon: <Zap size={24} />,
  },
};

/**
 * Logo with custom styling applied via className.
 */
export const CustomStyling: Story = {
  args: {
    icon: <Rocket size={24} />,
    text: "Acme Cloud",
    className: "opacity-80",
  },
};
