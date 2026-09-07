import { TestimonialsSection } from "@repo/design-system/components/blocks/testimonials/testimonials";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "blocks/testimonials/TestimonialsSection",
  component: TestimonialsSection,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TestimonialsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default testimonials section with three customer quotes in a grid.
 */
export const Default: Story = {
  args: {
    title: "What our customers say",
    testimonials: [
      {
        quote:
          "Acme cut our launch time from months to weeks. The built-in auth and billing meant we could focus entirely on our product.",
        author: "Sarah Chen",
        initials: "SC",
        role: "CTO, Northwind Labs",
      },
      {
        quote:
          "The developer experience is unmatched. Everything just works out of the box, and the docs are genuinely excellent.",
        author: "Marcus Rivera",
        initials: "MR",
        role: "Founder, Bitforge",
      },
      {
        quote:
          "We migrated our entire dashboard to Acme in a weekend. Our team's velocity has doubled since.",
        author: "Priya Patel",
        initials: "PP",
        role: "Engineering Lead, Cloudline",
      },
    ],
  },
};

/**
 * Testimonials section with a single quote.
 */
export const SingleQuote: Story = {
  args: {
    title: "Loved by builders",
    testimonials: [
      {
        quote:
          "I've tried every SaaS starter out there. Acme is the first one that felt production-ready on day one.",
        author: "James Okafor",
        initials: "JO",
        role: "Indie Hacker",
      },
    ],
  },
};

/**
 * Testimonials section with six quotes wrapping into two rows.
 */
export const ManyQuotes: Story = {
  args: {
    title: "Trusted by teams worldwide",
    testimonials: [
      {
        quote: "The best investment we made this year. Period.",
        author: "Elena Vasquez",
        initials: "EV",
        role: "CEO, Driftwave",
      },
      {
        quote:
          "Support is incredible. Every question answered within the hour.",
        author: "Tom Bakker",
        initials: "TB",
        role: "Product Manager, Skyloop",
      },
      {
        quote:
          "Multi-organization support saved us from building it ourselves. Months of work avoided.",
        author: "Aisha Diallo",
        initials: "AD",
        role: "VP Engineering, Lattice Co",
      },
      {
        quote:
          "Clean code, sane defaults, zero surprises. Exactly what we needed.",
        author: "Kenji Tanaka",
        initials: "KT",
        role: "Staff Engineer, Nimbus",
      },
      {
        quote:
          "Our onboarding conversion improved 40% after switching to Acme's flows.",
        author: "Laura Meyer",
        initials: "LM",
        role: "Growth Lead, Fernbrook",
      },
      {
        quote: "It scales with us. From two founders to a forty-person team.",
        author: "David Osei",
        initials: "DO",
        role: "Co-founder, Brightpath",
      },
    ],
  },
};
