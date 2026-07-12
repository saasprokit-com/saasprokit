import { FeatureShowcase } from "@repo/design-system/components/blocks/feature-showcase/feature-showcase";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BarChart3, CreditCard, ShieldCheck, Workflow } from "lucide-react";

const meta = {
  title: "blocks/feature-showcase/FeatureShowcase",
  component: FeatureShowcase,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof FeatureShowcase>;

export default meta;
type Story = StoryObj<typeof meta>;

const items = [
  {
    badge: "Authentication",
    icon: ShieldCheck,
    title: "Secure sign-in for every customer",
    description:
      "Acme ships with email, OAuth, and passkey authentication plus multi-organization support, so your users can bring their whole team.",
    bullets: [
      "Email, Google, and GitHub sign-in",
      "Two-factor authentication and passkeys",
      "Organization invites with role-based access",
    ],
  },
  {
    badge: "Billing",
    icon: CreditCard,
    title: "Revenue on autopilot",
    description:
      "Subscriptions, metered usage, and a self-serve customer portal are wired up end to end. Change a plan in one file and ship.",
    bullets: [
      "Stripe subscriptions and usage-based pricing",
      "Self-serve upgrades, downgrades, and cancellations",
      "Webhooks handled with retries and idempotency",
    ],
  },
  {
    badge: "Analytics",
    icon: BarChart3,
    title: "Know what your users love",
    description:
      "Track activation, retention, and revenue from a single dashboard. No third-party scripts, no cookie banners required.",
    bullets: [
      "Privacy-friendly, first-party analytics",
      "Funnels and cohort retention out of the box",
      "Export everything to your warehouse",
    ],
  },
];

/**
 * Three alternating feature rows; even rows render text-left, odd rows are
 * reversed automatically.
 */
export const Default: Story = {
  args: {
    items,
  },
};

/**
 * A single feature row for focused landing pages.
 */
export const SingleItem: Story = {
  args: {
    items: items.slice(0, 1),
  },
};

/**
 * Two rows demonstrating one normal and one reversed layout.
 */
export const TwoItems: Story = {
  args: {
    items: items.slice(0, 2),
  },
};

/**
 * Custom background via `className` and workflow-oriented copy.
 */
export const WithBackground: Story = {
  args: {
    className: "bg-muted/50",
    items: [
      {
        badge: "Automation",
        icon: Workflow,
        title: "Automate the busywork",
        description:
          "Connect Acme to the tools your team already uses and let workflows run themselves.",
        bullets: [
          "Trigger workflows from any event",
          "200+ prebuilt integrations",
          "Full audit trail for every run",
        ],
      },
      ...items.slice(0, 1),
    ],
  },
};
