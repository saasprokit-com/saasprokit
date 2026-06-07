import { ForgotPasswordSuccess } from "@repo/design-system/components/molecules/auth/forgot-password-success";
import type { Meta, StoryObj } from "@storybook/nextjs";

const meta = {
  title: "molecules/auth/ForgotPasswordSuccess",
  component: ForgotPasswordSuccess,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    nextjs: {
      appDirectory: true,
    },
  },
} satisfies Meta<typeof ForgotPasswordSuccess>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Confirmation shown after a password reset email is requested.
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
