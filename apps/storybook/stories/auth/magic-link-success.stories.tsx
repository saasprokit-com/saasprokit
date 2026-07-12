import { MagicLinkSuccess } from "@repo/design-system/components/molecules/auth/magic-link-success";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "molecules/auth/MagicLinkSuccess",
  component: MagicLinkSuccess,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    nextjs: {
      appDirectory: true,
    },
  },
} satisfies Meta<typeof MagicLinkSuccess>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Confirmation shown after a magic link has been sent.
 */
export const Default: Story = {
  args: {},
};

/**
 * Custom sign-up URL.
 */
export const CustomSignUpUrl: Story = {
  args: {
    signUpUrl: "/register",
  },
};
