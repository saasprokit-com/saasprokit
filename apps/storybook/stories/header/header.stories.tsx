import { Header } from "@repo/design-system/components/molecules/header/header";
import { Button } from "@repo/design-system/components/ui/button";
import type { Meta, StoryObj } from "@storybook/nextjs";
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
    left: (
      <nav className="hidden gap-6 md:flex">
        <Link
          className="font-medium text-muted-foreground text-sm hover:text-foreground"
          href="/"
        >
          Home
        </Link>
        <Link
          className="font-medium text-muted-foreground text-sm hover:text-foreground"
          href="/about"
        >
          About
        </Link>
        <Link
          className="font-medium text-muted-foreground text-sm hover:text-foreground"
          href="/blog"
        >
          Blog
        </Link>
      </nav>
    ),
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
    left: (
      <nav className="hidden gap-6 md:flex">
        <Link
          className="font-medium text-muted-foreground text-sm hover:text-foreground"
          href="/products"
        >
          Products
        </Link>
        <Link
          className="font-medium text-muted-foreground text-sm hover:text-foreground"
          href="/pricing"
        >
          Pricing
        </Link>
      </nav>
    ),
    right: (
      <Button asChild>
        <Link href="/start">Get Started</Link>
      </Button>
    ),
  },
};

/**
 * Header with only left section.
 */
export const LeftOnly: Story = {
  args: {
    logo: "Blog",
    left: (
      <nav className="hidden gap-6 md:flex">
        <Link
          className="font-medium text-muted-foreground text-sm hover:text-foreground"
          href="/"
        >
          Home
        </Link>
        <Link
          className="font-medium text-muted-foreground text-sm hover:text-foreground"
          href="/articles"
        >
          Articles
        </Link>
        <Link
          className="font-medium text-muted-foreground text-sm hover:text-foreground"
          href="/categories"
        >
          Categories
        </Link>
      </nav>
    ),
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
    left: (
      <div className="hidden items-center gap-4 md:flex">
        <nav className="flex gap-6">
          <Link
            className="font-medium text-muted-foreground text-sm hover:text-foreground"
            href="/dashboard"
          >
            Dashboard
          </Link>
          <Link
            className="font-medium text-muted-foreground text-sm hover:text-foreground"
            href="/projects"
          >
            Projects
          </Link>
        </nav>
      </div>
    ),
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
