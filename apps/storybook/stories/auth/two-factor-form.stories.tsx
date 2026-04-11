import { TwoFactorForm } from "@repo/design-system/components/molecules/auth/two-factor-form";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";

const meta = {
  title: "molecules/auth/TwoFactorForm",
  component: TwoFactorForm,
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
} satisfies Meta<typeof TwoFactorForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * TOTP (authenticator app) verification form.
 */
export const TOTP: Story = {
  args: {
    method: "totp",
  },
};

/**
 * OTP (email code) verification form with resend option.
 */
export const OTP: Story = {
  args: {
    method: "otp",
    onResendCode: fn(),
  },
};

/**
 * Form with backup code option.
 */
export const WithBackupCode: Story = {
  args: {
    method: "totp",
    onUseBackupCode: fn(),
  },
};

/**
 * Form with an error message.
 */
export const WithError: Story = {
  args: {
    method: "totp",
    error: "Invalid verification code. Please try again.",
  },
};

/**
 * Full featured form with all options.
 */
export const FullFeatured: Story = {
  args: {
    method: "otp",
    onResendCode: fn(),
    onUseBackupCode: fn(),
  },
};
