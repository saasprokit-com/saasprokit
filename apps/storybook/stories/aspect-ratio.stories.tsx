import { AspectRatio } from "@repo/design-system/components/ui/aspect-ratio";
import type { Meta, StoryObj } from "@storybook/nextjs";
import Image from "next/image";

// Aspect ratio numerators and denominators
const WIDESCREEN_WIDTH = 16;
const WIDESCREEN_HEIGHT = 9;
const LANDSCAPE_WIDTH = 4;
const LANDSCAPE_HEIGHT = 3;
const CINEMASCOPE_WIDTH = 2.35;
const CINEMASCOPE_HEIGHT = 1;
const SQUARE_RATIO = 1;

// Common aspect ratio values
const ASPECT_RATIO_16_9 = WIDESCREEN_WIDTH / WIDESCREEN_HEIGHT;
const ASPECT_RATIO_4_3 = LANDSCAPE_WIDTH / LANDSCAPE_HEIGHT;
const ASPECT_RATIO_CINEMASCOPE = CINEMASCOPE_WIDTH / CINEMASCOPE_HEIGHT;

/**
 * Displays content within a desired ratio.
 */
const meta: Meta<typeof AspectRatio> = {
  title: "ui/AspectRatio",
  component: AspectRatio,
  tags: ["autodocs"],
  argTypes: {},
  render: (args) => (
    <AspectRatio {...args} className="bg-slate-50 dark:bg-slate-800">
      <Image
        alt="Photo by Alvaro Pinot"
        className="rounded-md object-cover"
        fill
        src="https://images.unsplash.com/photo-1576075796033-848c2a5f3696?w=800&dpr=2&q=80"
      />
    </AspectRatio>
  ),
  decorators: [
    (StoryComponent) => (
      <div className="w-1/2">
        <StoryComponent />
      </div>
    ),
  ],
} satisfies Meta<typeof AspectRatio>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The default form of the aspect ratio.
 */
export const Default: Story = {
  args: {
    ratio: ASPECT_RATIO_16_9,
  },
};

/**
 * Use the `1:1` aspect ratio to display a square image.
 */
export const Square: Story = {
  args: {
    ratio: SQUARE_RATIO,
  },
};

/**
 * Use the `4:3` aspect ratio to display a landscape image.
 */
export const Landscape: Story = {
  args: {
    ratio: ASPECT_RATIO_4_3,
  },
};

/**
 * Use the `2.35:1` aspect ratio to display a cinemascope image.
 */
export const Cinemascope: Story = {
  args: {
    ratio: ASPECT_RATIO_CINEMASCOPE,
  },
};
