import { AuthCard } from "@repo/design-system/components/molecules/auth/auth-card";
import type { Meta, StoryObj } from "@storybook/nextjs";

const meta = {
  title: "molecules/auth/AuthCard",
  component: AuthCard,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
  },
} satisfies Meta<typeof AuthCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default auth card with title and description.
 */
export const Default: Story = {
  args: {
    title: "Welcome",
    description: "Sign in to your account to continue",
    children: (
      <div className="text-center text-muted-foreground text-sm">
        Form content goes here
      </div>
    ),
  },
};

/**
 * Auth card with footer content.
 */
export const WithFooter: Story = {
  args: {
    title: "Sign In",
    description: "Enter your credentials",
    children: (
      <div className="text-center text-muted-foreground text-sm">
        Form content goes here
      </div>
    ),
    footer: (
      <p className="text-muted-foreground text-sm">
        Don&apos;t have an account?{" "}
        {/* biome-ignore lint/a11y/useValidAnchor: This is a storybook demo */}
        <a className="text-primary hover:underline" href="#">
          Sign up
        </a>
      </p>
    ),
  },
};

/**
 * Auth card without description.
 */
export const WithoutDescription: Story = {
  args: {
    title: "Create Account",
    children: (
      <div className="text-center text-muted-foreground text-sm">
        Form content goes here
      </div>
    ),
  },
};
