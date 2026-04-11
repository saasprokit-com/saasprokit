import { ForgotPasswordForm } from "@repo/design-system/components/molecules/auth/forgot-password-form";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";

const meta = {
  title: "molecules/auth/ForgotPasswordForm",
  component: ForgotPasswordForm,
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
} satisfies Meta<typeof ForgotPasswordForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default forgot password form.
 */
export const Default: Story = {
  args: {},
};

/**
 * Success state after email is sent.
 */
export const Success: Story = {
  args: {
    success: true,
  },
};

/**
 * Forgot password form with an error message.
 */
export const WithError: Story = {
  args: {
    error: "Unable to send reset email. Please try again later.",
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
