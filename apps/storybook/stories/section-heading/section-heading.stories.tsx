import { SectionHeading } from "@repo/design-system/components/molecules/section-heading/section-heading";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "molecules/section-heading/SectionHeading",
  component: SectionHeading,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="p-10">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default section heading with title only.
 */
export const Default: Story = {
  args: {
    children: "Features",
  },
};

/**
 * Section heading with a subtitle aligned to the right edge.
 */
export const WithSubtitle: Story = {
  args: {
    children: "Pricing",
    subtitle: "02 / PLANS",
  },
};

/**
 * Section heading with an id for anchor navigation.
 */
export const WithAnchorId: Story = {
  args: {
    children: "Frequently Asked Questions",
    subtitle: "04 / FAQ",
    id: "faq",
  },
};

/**
 * Section heading with a long title that wraps on smaller viewports.
 */
export const LongTitle: Story = {
  args: {
    children: "Everything your team needs to ship faster",
    subtitle: "01 / OVERVIEW",
  },
};
