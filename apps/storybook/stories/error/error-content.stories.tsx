import { ErrorContent } from "@repo/design-system/components/molecules/error/error-content";
import { Button } from "@repo/design-system/components/ui/button";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "molecules/error/ErrorContent",
  component: ErrorContent,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ErrorContent>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The 404 page, as rendered by the app's not-found boundaries.
 */
export const NotFound: Story = {
  args: {
    children: (
      <>
        <Button variant="outline">Go Back</Button>
        <Button>Back to Home</Button>
      </>
    ),
    code: "404",
    description: (
      <>
        It seems like the page you&apos;re looking for <br />
        does not exist or might have been removed.
      </>
    ),
    title: "Oops! Page Not Found!",
  },
};

/**
 * The 500 page, as rendered by the error boundaries.
 */
export const ServerError: Story = {
  args: {
    children: (
      <>
        <Button variant="outline">Go Back</Button>
        <Button>Try Again</Button>
      </>
    ),
    code: "500",
    description: (
      <>
        We apologize for the inconvenience. <br /> Please try again later.
      </>
    ),
    title: "Oops! Something went wrong :')",
  },
};

/**
 * When Next.js supplies an error digest, it is surfaced so users can quote it
 * in a support request.
 */
export const WithDigest: Story = {
  args: {
    ...ServerError.args,
    digest: "3271819437",
  },
};

/**
 * Contained variant. Passing a className overrides the default full-viewport
 * `h-svh`, so the error renders inside the app shell with the sidebar and
 * header still mounted.
 */
export const InShell: Story = {
  args: {
    ...ServerError.args,
    className: "h-auto min-h-[60vh] flex-1",
  },
};
