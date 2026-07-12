import { Header } from "@repo/design-system/components/molecules/header/header";
import { Button } from "@repo/design-system/components/ui/button";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Link from "next/link";

const meta = {
  title: "molecules/header/Header",
  component: Header,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default header with navigation and actions.
 */
export const Default: Story = {
  args: {
    logo: "Acme",
    items: [
      { href: "/", label: "Home" },
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
    ],
    right: (
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost">
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    ),
  },
};

/**
 * Header with custom logo component.
 */
export const WithLogoComponent: Story = {
  args: {
    logo: (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-primary" />
        <span>Brand</span>
      </div>
    ),
    items: [
      { href: "/products", label: "Products" },
      { href: "/pricing", label: "Pricing" },
    ],
    right: (
      <Button asChild>
        <Link href="/start">Get Started</Link>
      </Button>
    ),
  },
};

/**
 * Header with only nav items, no right section.
 */
export const LeftOnly: Story = {
  args: {
    logo: "Blog",
    items: [
      { href: "/", label: "Home" },
      { href: "/articles", label: "Articles" },
      { href: "/categories", label: "Categories" },
    ],
  },
};

/**
 * Header with only right section.
 */
export const RightOnly: Story = {
  args: {
    logo: "Dashboard",
    right: (
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost">
          <Link href="/settings">Settings</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/logout">Logout</Link>
        </Button>
      </div>
    ),
  },
};

/**
 * Minimal header with only logo.
 */
export const LogoOnly: Story = {
  args: {
    logo: "Simple Site",
  },
};

/**
 * Header with search and user menu.
 */
export const WithSearchAndUser: Story = {
  args: {
    logo: "App",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/projects", label: "Projects" },
    ],
    right: (
      <div className="flex items-center gap-4">
        <input
          className="hidden rounded-md border bg-background px-3 py-1.5 text-sm md:block"
          placeholder="Search..."
          type="search"
        />
        <div className="h-8 w-8 rounded-full bg-muted" />
      </div>
    ),
  },
};

/**
 * Header with mobile menu using larger breakpoint (lg).
 * Hamburger appears below lg (1024px); desktop nav above.
 */
export const MobileLargeBreakpoint: Story = {
  args: {
    logo: "App",
    mobileBreakpoint: "lg",
    items: [
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/docs", label: "Docs" },
      { href: "/blog", label: "Blog" },
    ],
    right: (
      <Button asChild>
        <Link href="/start">Get Started</Link>
      </Button>
    ),
  },
};

/**
 * Header with an external link in the nav.
 */
export const WithExternalLink: Story = {
  args: {
    logo: "Acme",
    items: [
      { href: "/", label: "Home" },
      { href: "/docs", label: "Docs" },
      { href: "https://github.com/acme", label: "GitHub", external: true },
    ],
  },
};
