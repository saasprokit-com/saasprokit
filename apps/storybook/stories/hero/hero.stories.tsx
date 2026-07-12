import { Hero } from "@repo/design-system/components/blocks/hero/hero";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Rocket, ShieldCheck, Zap } from "lucide-react";

const meta = {
  title: "blocks/hero/Hero",
  component: Hero,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Hero>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Full hero with badge, highlighted text, both CTAs, and benefits.
 */
export const Default: Story = {
  args: {
    badge: "New: Acme AI Assistant",
    title: "Ship your SaaS",
    highlightedText: "10x faster",
    subtitle:
      "Acme gives your team everything you need to build, launch, and scale a modern SaaS product without reinventing the wheel.",
    primaryCta: { href: "/signup", label: "Start free trial" },
    secondaryCta: { href: "/demo", label: "Book a demo" },
    benefits: [
      "No credit card required",
      "14-day free trial",
      "Cancel anytime",
    ],
  },
};

/**
 * Minimal hero with only the required title and subtitle.
 */
export const Minimal: Story = {
  args: {
    title: "Build better products with Acme",
    subtitle:
      "The all-in-one platform for modern teams to plan, build, and ship.",
  },
};

/**
 * Hero with custom icons for each benefit item.
 */
export const WithIconBenefits: Story = {
  args: {
    badge: "Trusted by 10,000+ teams",
    title: "The platform behind",
    highlightedText: "great teams",
    subtitle:
      "From startups to enterprises, Acme powers the workflows that keep products shipping.",
    primaryCta: { href: "/signup", label: "Get started" },
    benefits: [
      {
        icon: <Zap className="h-4 w-4 text-yellow-500" />,
        text: "Blazing fast setup",
      },
      {
        icon: <ShieldCheck className="h-4 w-4 text-green-500" />,
        text: "SOC 2 compliant",
      },
      {
        icon: <Rocket className="h-4 w-4 text-blue-500" />,
        text: "Deploy in minutes",
      },
    ],
  },
};

/**
 * Hero without the gradient background decoration.
 */
export const WithoutGradient: Story = {
  args: {
    title: "A cleaner look for Acme",
    subtitle:
      "Turn off the gradient background when embedding the hero in a busy layout.",
    primaryCta: { href: "/signup", label: "Start free trial" },
    secondaryCta: { href: "/pricing", label: "View pricing" },
    showGradientBackground: false,
  },
};

/**
 * Hero with a single primary call to action.
 */
export const SingleCta: Story = {
  args: {
    badge: "Limited beta",
    title: "Join the Acme beta",
    subtitle: "Be among the first to try the next generation of our platform.",
    primaryCta: { href: "/beta", label: "Request access" },
  },
};
