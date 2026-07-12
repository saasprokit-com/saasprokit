import { Footer } from "@repo/design-system/components/molecules/footer/footer";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Github, Instagram, Linkedin, Twitter } from "lucide-react";

const meta = {
  title: "molecules/footer/Footer",
  component: Footer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

const Logo = () => <div className="font-bold text-xl">Acme Inc</div>;

/**
 * Default footer with all sections.
 */
export const Default: Story = {
  args: {
    logo: <Logo />,
    description:
      "Building the future of web development with modern tools and best practices.",
    sections: [
      {
        title: "Product",
        links: [
          { label: "Features", href: "/features" },
          { label: "Pricing", href: "/pricing" },
          { label: "Integrations", href: "/integrations" },
          { label: "Changelog", href: "/changelog" },
        ],
      },
      {
        title: "Company",
        links: [
          { label: "About", href: "/about" },
          { label: "Blog", href: "/blog" },
          { label: "Careers", href: "/careers" },
          { label: "Contact", href: "/contact" },
        ],
      },
      {
        title: "Resources",
        links: [
          { label: "Documentation", href: "/docs" },
          { label: "Help Center", href: "/help" },
          { label: "Community", href: "/community" },
          { label: "Status", href: "/status" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Privacy", href: "/privacy" },
          { label: "Terms", href: "/terms" },
          { label: "Cookies", href: "/cookies" },
          { label: "License", href: "/license" },
        ],
      },
    ],
    socialLinks: [
      {
        label: "GitHub",
        href: "https://github.com",
        icon: <Github size={20} />,
      },
      {
        label: "Twitter",
        href: "https://twitter.com",
        icon: <Twitter size={20} />,
      },
      {
        label: "LinkedIn",
        href: "https://linkedin.com",
        icon: <Linkedin size={20} />,
      },
      {
        label: "Instagram",
        href: "https://instagram.com",
        icon: <Instagram size={20} />,
      },
    ],
    bottomLinks: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Settings", href: "/cookies" },
    ],
  },
};

/**
 * Minimal footer with fewer sections.
 */
export const Minimal: Story = {
  args: {
    logo: <Logo />,
    description: "Simple and elegant solutions.",
    sections: [
      {
        title: "Links",
        links: [
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Contact", href: "/contact" },
        ],
      },
    ],
    socialLinks: [
      {
        label: "GitHub",
        href: "https://github.com",
        icon: <Github size={20} />,
      },
      {
        label: "Twitter",
        href: "https://twitter.com",
        icon: <Twitter size={20} />,
      },
    ],
  },
};

/**
 * Footer without social links.
 */
export const WithoutSocial: Story = {
  args: {
    logo: <Logo />,
    description: "Professional business solutions.",
    sections: [
      {
        title: "Company",
        links: [
          { label: "About", href: "/about" },
          { label: "Team", href: "/team" },
          { label: "Careers", href: "/careers" },
        ],
      },
      {
        title: "Support",
        links: [
          { label: "Help", href: "/help" },
          { label: "FAQ", href: "/faq" },
          { label: "Contact", href: "/contact" },
        ],
      },
    ],
    bottomLinks: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
};

/**
 * Footer with external links.
 */
export const WithExternalLinks: Story = {
  args: {
    logo: <Logo />,
    description: "Connect with our ecosystem.",
    sections: [
      {
        title: "Ecosystem",
        links: [
          { label: "GitHub", href: "https://github.com", external: true },
          { label: "NPM", href: "https://npmjs.com", external: true },
          { label: "Discord", href: "https://discord.com", external: true },
        ],
      },
    ],
    copyright: "© 2025 Acme Inc. Made with love.",
  },
};

/**
 * Footer with custom copyright.
 */
export const CustomCopyright: Story = {
  args: {
    logo: <Logo />,
    copyright: "© 2025 Acme Inc. All rights reserved. Built with Next.js.",
    bottomLinks: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
};
