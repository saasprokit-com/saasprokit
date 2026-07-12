import { SimpleFooter } from "@repo/design-system/components/molecules/footer/simple-footer";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "molecules/footer/SimpleFooter",
  component: SimpleFooter,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SimpleFooter>;

export default meta;

type Story = StoryObj<typeof meta>;

const Logo = () => <div className="font-bold text-lg">Acme</div>;

/**
 * Default simple footer with logo and links.
 */
export const Default: Story = {
  args: {
    logo: <Logo />,
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Contact", href: "/contact" },
    ],
  },
};

/**
 * Simple footer without logo.
 */
export const WithoutLogo: Story = {
  args: {
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
};

/**
 * Simple footer with custom copyright.
 */
export const CustomCopyright: Story = {
  args: {
    logo: <Logo />,
    copyright: "© 2025 Acme Inc. Made with love.",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
};

/**
 * Simple footer with only copyright.
 */
export const CopyrightOnly: Story = {
  args: {
    copyright: "© 2025 Your Company. All rights reserved.",
  },
};

/**
 * Simple footer with many links.
 */
export const ManyLinks: Story = {
  args: {
    logo: <Logo />,
    links: [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Contact", href: "/contact" },
    ],
  },
};
