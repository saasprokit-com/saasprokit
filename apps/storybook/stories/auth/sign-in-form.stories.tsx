import { SignInForm } from "@repo/design-system/components/molecules/auth/sign-in-form";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

const meta = {
  title: "molecules/auth/SignInForm",
  component: SignInForm,
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
} satisfies Meta<typeof SignInForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default sign-in form with social providers.
 */
export const Default: Story = {
  args: {
    socialProviders: ["google", "github"],
  },
};

/**
 * Sign-in form without social providers.
 */
export const WithoutSocialProviders: Story = {
  args: {
    socialProviders: [],
  },
};

/**
 * Sign-in form with an error message.
 */
export const WithError: Story = {
  args: {
    socialProviders: ["google", "github"],
    error: "Invalid email or password. Please try again.",
  },
};

/**
 * Sign-in form with custom URLs.
 */
export const CustomUrls: Story = {
  args: {
    socialProviders: ["google", "github"],
    signUpUrl: "/register",
    forgotPasswordUrl: "/forgot",
  },
};
