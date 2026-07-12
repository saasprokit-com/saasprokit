import { CTABanner } from "@repo/design-system/components/blocks/cta-banner/cta-banner";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "blocks/cta-banner/CTABanner",
  component: CTABanner,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof CTABanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Full CTA banner with subtitle and both call-to-action buttons.
 */
export const Default: Story = {
  args: {
    title: "Ready to grow with Acme?",
    subtitle:
      "Join thousands of teams already shipping faster. Start your free trial today, no credit card required.",
    primaryCta: { href: "/signup", label: "Start free trial" },
    secondaryCta: { href: "/contact", label: "Talk to sales" },
  },
};

/**
 * CTA banner with only a title.
 */
export const TitleOnly: Story = {
  args: {
    title: "Start building with Acme today",
  },
};

/**
 * CTA banner with a single primary button.
 */
export const PrimaryOnly: Story = {
  args: {
    title: "Upgrade to Acme Pro",
    subtitle: "Unlock advanced analytics, priority support, and more.",
    primaryCta: { href: "/pricing", label: "See plans" },
  },
};

/**
 * CTA banner with a single secondary button.
 */
export const SecondaryOnly: Story = {
  args: {
    title: "Questions about enterprise?",
    subtitle: "Our team can walk you through security, compliance, and SSO.",
    secondaryCta: { href: "/contact", label: "Contact sales" },
  },
};
