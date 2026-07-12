import { SocialProofBar } from "@repo/design-system/components/blocks/social-proof-bar/social-proof-bar";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "blocks/social-proof-bar/SocialProofBar",
  component: SocialProofBar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SocialProofBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default social proof bar with a row of customer logos.
 */
export const Default: Story = {
  args: {
    label: "Trusted by fast-growing companies around the world",
    items: [
      { name: "Northwind", description: "E-commerce" },
      { name: "Globex", description: "Fintech" },
      { name: "Initech", description: "Enterprise software" },
      { name: "Umbrella Labs", description: "Biotech" },
      { name: "Hooli", description: "Consumer tech" },
      { name: "Stark Industries", description: "Manufacturing" },
    ],
  },
};

/**
 * Social proof bar with a small number of marquee customers.
 */
export const FewItems: Story = {
  args: {
    label: "Powering product teams at",
    items: [
      { name: "Globex", description: "Series C fintech" },
      { name: "Initech", description: "Fortune 500" },
      { name: "Northwind", description: "10M+ users" },
    ],
  },
};

/**
 * Social proof bar framed around usage metrics instead of industries.
 */
export const MetricsFocused: Story = {
  args: {
    label: "Why teams choose Acme",
    items: [
      { name: "10,000+ teams", description: "shipping with Acme" },
      { name: "99.99% uptime", description: "over the last 12 months" },
      { name: "4.8/5 rating", description: "across 2,300 reviews" },
      { name: "150+ countries", description: "served worldwide" },
    ],
  },
};
