import { SocialProviders } from "@repo/design-system/components/molecules/auth/social-providers";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

const meta = {
  title: "molecules/auth/SocialProviders",
  component: SocialProviders,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    onProviderClick: fn(),
  },
} satisfies Meta<typeof SocialProviders>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * All social providers displayed.
 */
export const AllProviders: Story = {
  args: {
    providers: ["google", "github"],
  },
};

/**
 * Only Google provider.
 */
export const GoogleOnly: Story = {
  args: {
    providers: ["google"],
  },
};

/**
 * Only GitHub provider.
 */
export const GitHubOnly: Story = {
  args: {
    providers: ["github"],
  },
};

/**
 * Loading state disables buttons.
 */
export const Loading: Story = {
  args: {
    providers: ["google", "github"],
    isLoading: true,
  },
};

/**
 * Disabled state.
 */
export const Disabled: Story = {
  args: {
    providers: ["google", "github"],
    disabled: true,
  },
};
