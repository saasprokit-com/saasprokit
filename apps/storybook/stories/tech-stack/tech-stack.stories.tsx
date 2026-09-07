import { TechStack } from "@repo/design-system/components/blocks/tech-stack/tech-stack";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "blocks/tech-stack/TechStack",
  component: TechStack,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TechStack>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default tech stack section with a full row of eight technologies.
 */
export const Default: Story = {
  args: {
    badge: "Tech Stack",
    title: "Built on a modern foundation",
    subtitle:
      "Acme is powered by battle-tested tools you already know and love.",
    technologies: [
      { name: "Next.js", description: "React framework" },
      { name: "TypeScript", description: "Type safety" },
      { name: "Prisma", description: "Database ORM" },
      { name: "PostgreSQL", description: "Database" },
      { name: "Stripe", description: "Payments" },
      { name: "Tailwind CSS", description: "Styling" },
      { name: "Turborepo", description: "Monorepo builds" },
      { name: "Vercel", description: "Deployment" },
    ],
  },
};

/**
 * Tech stack section without the badge or subtitle.
 */
export const Minimal: Story = {
  args: {
    title: "Our stack",
    technologies: [
      { name: "React", description: "UI library" },
      { name: "Node.js", description: "Runtime" },
      { name: "Redis", description: "Caching" },
      { name: "Docker", description: "Containers" },
    ],
  },
};

/**
 * Tech stack section with a shorter list that doesn't fill the grid row.
 */
export const FewItems: Story = {
  args: {
    badge: "Integrations",
    title: "Works with your tools",
    subtitle: "Connect Acme to the services your team already uses.",
    technologies: [
      { name: "Slack", description: "Notifications" },
      { name: "GitHub", description: "Source control" },
      { name: "Linear", description: "Issue tracking" },
    ],
  },
};
