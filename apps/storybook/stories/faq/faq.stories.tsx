import { FAQSection } from "@repo/design-system/components/blocks/faq/faq";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "blocks/faq/FAQSection",
  component: FAQSection,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof FAQSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default FAQ section with badge, subtitle, and a full set of questions.
 */
export const Default: Story = {
  args: {
    badge: "FAQ",
    title: "Frequently asked questions",
    subtitle:
      "Everything you need to know about Acme. Can't find the answer you're looking for? Reach out to our support team.",
    items: [
      {
        question: "What is Acme?",
        answer:
          "Acme is an all-in-one SaaS platform that helps teams ship products faster with built-in authentication, billing, and analytics.",
      },
      {
        question: "Do you offer a free trial?",
        answer:
          "Yes. Every plan comes with a 14-day free trial. No credit card required to get started.",
      },
      {
        question: "Can I change plans later?",
        answer:
          "Absolutely. You can upgrade or downgrade your plan at any time from your billing settings. Changes are prorated automatically.",
      },
      {
        question: "How does team billing work?",
        answer:
          "You're billed per seat on a monthly or annual basis. Adding or removing team members adjusts your invoice on the next billing cycle.",
      },
      {
        question: "Is my data secure?",
        answer:
          "We use industry-standard encryption at rest and in transit, and undergo regular third-party security audits. Acme is SOC 2 Type II compliant.",
      },
    ],
  },
};

/**
 * FAQ section without the badge or subtitle, showing the minimal required props.
 */
export const Minimal: Story = {
  args: {
    title: "Common questions",
    items: [
      {
        question: "How do I get started?",
        answer:
          "Sign up for a free account and follow the onboarding guide. Most teams are up and running in under five minutes.",
      },
      {
        question: "Do you offer support?",
        answer:
          "Yes, email support is included on all plans, with priority support available on Pro and Enterprise.",
      },
    ],
  },
};

/**
 * FAQ section focused on billing questions, using a different badge label.
 */
export const BillingFocused: Story = {
  args: {
    badge: "Billing",
    title: "Billing and payments",
    subtitle: "Answers about invoices, refunds, and payment methods.",
    items: [
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept all major credit cards, and ACH or wire transfer for annual Enterprise contracts.",
      },
      {
        question: "Can I get a refund?",
        answer:
          "If you're not satisfied within the first 30 days, contact us and we'll issue a full refund, no questions asked.",
      },
      {
        question: "Where can I find my invoices?",
        answer:
          "All invoices are available in your billing settings and are also emailed to your billing contact each cycle.",
      },
    ],
  },
};
