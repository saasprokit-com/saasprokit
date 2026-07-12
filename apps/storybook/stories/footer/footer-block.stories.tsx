import { Footer } from "@repo/design-system/components/blocks/footer/footer";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "blocks/footer/Footer",
  component: Footer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default terminal-style block footer with brand, taglines, and four link columns.
 */
export const Default: Story = {
  args: {
    brand: "acme",
    taglines: ["Ship faster.", "Scale with confidence."],
    columns: [
      {
        title: "PRODUCT",
        links: [
          { label: "Features", href: "/features" },
          { label: "Pricing", href: "/pricing" },
          { label: "Changelog", href: "/changelog" },
          { label: "Roadmap", href: "/roadmap" },
        ],
      },
      {
        title: "RESOURCES",
        links: [
          { label: "Documentation", href: "/docs" },
          { label: "Blog", href: "/blog" },
          { label: "Guides", href: "/guides" },
        ],
      },
      {
        title: "COMPANY",
        links: [
          { label: "About", href: "/about" },
          { label: "Careers", href: "/careers" },
          { label: "Contact", href: "/contact" },
        ],
      },
      {
        title: "LEGAL",
        links: [
          { label: "Privacy", href: "/privacy" },
          { label: "Terms", href: "/terms" },
        ],
      },
    ],
    copyright: "© 2026 Acme Inc. All rights reserved.",
  },
};

/**
 * Block footer without taglines, showing only the brand mark above the columns.
 */
export const WithoutTaglines: Story = {
  args: {
    brand: "acme",
    columns: [
      {
        title: "PRODUCT",
        links: [
          { label: "Features", href: "/features" },
          { label: "Pricing", href: "/pricing" },
        ],
      },
      {
        title: "COMPANY",
        links: [
          { label: "About", href: "/about" },
          { label: "Contact", href: "/contact" },
        ],
      },
    ],
    copyright: "© 2026 Acme Inc.",
  },
};

/**
 * Minimal block footer with a single link column.
 */
export const SingleColumn: Story = {
  args: {
    brand: "acme",
    taglines: ["Built for developers."],
    columns: [
      {
        title: "LINKS",
        links: [
          { label: "Home", href: "/" },
          { label: "Docs", href: "/docs" },
          { label: "GitHub", href: "https://github.com" },
        ],
      },
    ],
    copyright: "© 2026 Acme Inc.",
  },
};
