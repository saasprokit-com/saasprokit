import { FeaturesGrid } from "@repo/design-system/components/blocks/features-grid/features-grid";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  BarChart3,
  CreditCard,
  Globe,
  Lock,
  Mail,
  Rocket,
  Shield,
  Users,
  Zap,
} from "lucide-react";

const meta = {
  title: "blocks/features-grid/FeaturesGrid",
  component: FeaturesGrid,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof FeaturesGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const features = [
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "SSO, two-factor authentication, and audit logs baked in from day one.",
  },
  {
    icon: Zap,
    title: "Blazing Fast",
    description:
      "Edge-rendered pages and optimistic UI keep every interaction instant.",
  },
  {
    icon: Users,
    title: "Team Management",
    description:
      "Invite teammates, assign roles, and manage multiple organizations.",
  },
  {
    icon: CreditCard,
    title: "Billing Built In",
    description:
      "Subscriptions, usage-based pricing, and a customer portal out of the box.",
  },
  {
    icon: Globe,
    title: "Global Ready",
    description:
      "Internationalized routing and translations for a worldwide audience.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "Track activation, retention, and revenue with built-in dashboards.",
  },
];

/**
 * Default three-column grid with badge and subtitle.
 */
export const Default: Story = {
  args: {
    badge: "Features",
    title: "Everything you need to ship",
    subtitle:
      "Acme gives your team the building blocks to launch a production-grade SaaS in days, not months.",
    features,
  },
};

/**
 * Two-column layout for a shorter list of features.
 */
export const TwoColumns: Story = {
  args: {
    badge: "Why Acme",
    title: "Built for modern teams",
    subtitle: "Fewer moving parts, more shipping.",
    columns: 2,
    features: features.slice(0, 4),
  },
};

/**
 * Four-column layout for dense feature listings.
 */
export const FourColumns: Story = {
  args: {
    title: "The full toolkit",
    columns: 4,
    features: [
      ...features.slice(0, 6),
      {
        icon: Lock,
        title: "Role-Based Access",
        description: "Fine-grained permissions for every member and API key.",
      },
      {
        icon: Mail,
        title: "Transactional Email",
        description: "Beautiful, branded emails delivered reliably.",
      },
    ],
  },
};

/**
 * Minimal header: title only, no badge or subtitle.
 */
export const Minimal: Story = {
  args: {
    title: "Core capabilities",
    features: features.slice(0, 3),
  },
};

/**
 * With an `id` anchor for in-page navigation and a custom background.
 */
export const WithAnchorAndBackground: Story = {
  args: {
    badge: "Platform",
    title: "One platform, every workflow",
    subtitle: "Jump here from the navbar via the #features anchor.",
    id: "features",
    className: "bg-muted/50",
    features,
  },
};

/**
 * Launch-focused variant with alternate copy.
 */
export const LaunchFocused: Story = {
  args: {
    badge: "Ship faster",
    title: "From idea to production in a weekend",
    subtitle: "Acme handles the boring parts so you can focus on your product.",
    features: [
      {
        icon: Rocket,
        title: "Instant Deploys",
        description: "Push to main and your changes are live in seconds.",
      },
      {
        icon: Shield,
        title: "Secure Defaults",
        description: "Sensible security settings enabled from the start.",
      },
      {
        icon: Zap,
        title: "Zero Config",
        description: "Auth, billing, and email pre-wired and ready to go.",
      },
    ],
  },
};
