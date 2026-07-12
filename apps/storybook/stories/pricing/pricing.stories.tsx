import { Pricing } from "@repo/design-system/components/blocks/pricing/pricing";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "blocks/pricing/Pricing",
  component: Pricing,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Pricing>;

export default meta;
type Story = StoryObj<typeof meta>;

const tiers = [
  {
    name: "Starter",
    description: "For individuals and side projects.",
    monthlyPrice: 0,
    annualPrice: 0,
    cta: "Get started",
    ctaHref: "/signup",
    features: [
      "Up to 3 projects",
      "1 team member",
      "Community support",
      "Basic analytics",
    ],
  },
  {
    name: "Pro",
    description: "For growing teams that need more power.",
    monthlyPrice: 29,
    annualPrice: 24,
    cta: "Start free trial",
    ctaHref: "/signup?plan=pro",
    popular: true,
    features: [
      "Unlimited projects",
      "Up to 10 team members",
      "Priority email support",
      "Advanced analytics",
      "Custom domains",
    ],
  },
  {
    name: "Enterprise",
    description: "For organizations with advanced needs.",
    monthlyPrice: 99,
    annualPrice: 82,
    cta: "Contact sales",
    ctaHref: "/contact",
    features: [
      "Everything in Pro",
      "Unlimited team members",
      "SSO and SAML",
      "Dedicated success manager",
      "99.9% uptime SLA",
    ],
  },
];

/**
 * Default pricing section with three tiers, a highlighted popular plan,
 * and the monthly/annual billing toggle.
 */
export const Default: Story = {
  args: {
    badge: "Pricing",
    title: "Simple, transparent pricing",
    subtitle:
      "Choose the plan that fits your team. Upgrade, downgrade, or cancel anytime.",
    tiers,
  },
};

/**
 * Pricing section without the billing period toggle, showing monthly prices only.
 */
export const WithoutBillingToggle: Story = {
  args: {
    title: "Plans for every team",
    subtitle: "Straightforward monthly pricing with no hidden fees.",
    tiers,
    showBillingToggle: false,
  },
};

/**
 * Pricing section with a single paid tier and explicit button variant.
 */
export const SingleTier: Story = {
  args: {
    badge: "Early access",
    title: "One plan, everything included",
    tiers: [
      {
        name: "Acme Pro",
        description: "Full access to every feature while in early access.",
        monthlyPrice: 19,
        annualPrice: 16,
        cta: "Join early access",
        ctaHref: "/signup",
        variant: "default",
        features: [
          "Unlimited projects and members",
          "All integrations",
          "Priority support",
          "Early access to new features",
        ],
      },
    ],
  },
};

/**
 * Pricing section without a popular tier, rendering all cards with equal weight.
 */
export const NoPopularTier: Story = {
  args: {
    title: "Compare plans",
    tiers: tiers.map(({ popular: _popular, ...tier }) => tier),
  },
};
