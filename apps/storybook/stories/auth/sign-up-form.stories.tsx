import { SignUpForm } from "@repo/design-system/components/molecules/auth/sign-up-form";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

const meta = {
  title: "molecules/auth/SignUpForm",
  component: SignUpForm,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    nextjs: {
      appDirectory: true,
    },
  },
  args: {
    onSubmit: fn(),
    onSocialLogin: fn(),
  },
} satisfies Meta<typeof SignUpForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default sign-up form with social providers.
 */
export const Default: Story = {
  args: {
    socialProviders: ["google", "github"],
  },
};

/**
 * Sign-up form without social providers.
 */
export const WithoutSocialProviders: Story = {
  args: {
    socialProviders: [],
  },
};

/**
 * Sign-up form with an error message.
 */
export const WithError: Story = {
  args: {
    socialProviders: ["google", "github"],
    error: "An account with this email already exists.",
  },
};

/**
 * Sign-up form with custom sign-in URL.
 */
export const CustomSignInUrl: Story = {
  args: {
    socialProviders: ["google", "github"],
    signInUrl: "/login",
  },
};
