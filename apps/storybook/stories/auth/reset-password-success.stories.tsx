import { ResetPasswordSuccess } from "@repo/design-system/components/molecules/auth/reset-password-success";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "molecules/auth/ResetPasswordSuccess",
  component: ResetPasswordSuccess,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    nextjs: {
      appDirectory: true,
    },
  },
} satisfies Meta<typeof ResetPasswordSuccess>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Confirmation shown after the password has been reset.
 */
export const Default: Story = {
  args: {},
};

/**
 * Custom sign-in URL.
 */
export const CustomSignInUrl: Story = {
  args: {
    signInUrl: "/login",
  },
};
