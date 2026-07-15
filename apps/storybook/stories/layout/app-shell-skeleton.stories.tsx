import { AppShellSkeleton } from "@repo/design-system/components/layout/app-shell-skeleton";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "layout/AppShellSkeleton",
  component: AppShellSkeleton,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AppShellSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Fallback for the authenticated app shell, shown while the org/account layouts
 * resolve their session and membership queries. It reuses the real sidebar
 * primitives so the chrome does not shift when the actual shell streams in.
 */
export const Default: Story = {};
