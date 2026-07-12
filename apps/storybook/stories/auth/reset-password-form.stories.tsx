import { ResetPasswordForm } from "@repo/design-system/components/molecules/auth/reset-password-form";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

const meta = {
  title: "molecules/auth/ResetPasswordForm",
  component: ResetPasswordForm,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    nextjs: {
      appDirectory: true,
    },
  },
  args: {
    onSubmit: fn(),
  },
} satisfies Meta<typeof ResetPasswordForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default reset password form.
 */
export const Default: Story = {
  args: {},
};

/**
 * Reset password form with an error message.
 */
export const WithError: Story = {
  args: {
    error: "Reset link has expired. Please request a new one.",
  },
};

/**
 * Custom sign-in URL.
 */
export const CustomSignInUrl: Story = {
  args: {
    signInUrl: "/login",
  },
};
