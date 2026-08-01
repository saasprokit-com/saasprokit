import { Toaster } from "@repo/design-system/components/ui/sonner";
import { TooltipProvider } from "@repo/design-system/components/ui/tooltip";
import { MotionProvider } from "@repo/design-system/providers/motion";
import { ThemeProvider } from "@repo/design-system/providers/theme";
import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview } from "@storybook/nextjs";

import "@repo/design-system/styles/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    chromatic: {
      modes: {
        light: {
          theme: "light",
          className: "light",
        },
        dark: {
          theme: "dark",
          className: "dark",
        },
      },
    },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: "light",
        dark: "dark",
      },
      defaultTheme: "light",
    }),
    // NOTE: Storybook renders in the browser default sans, not Geist. Applying
    // the `fonts` helper here pulls in the `geist` package, which imports
    // `next/font/local` — a Next compile-time transform the Vite builder cannot
    // resolve, so the preview build fails outright. Matching the app's typeface
    // needs a plain @font-face for Geist rather than the next/font helper.
    (Story) => (
      <div className="bg-background">
        <ThemeProvider>
          <MotionProvider>
            <TooltipProvider>
              <Story />
            </TooltipProvider>
          </MotionProvider>
          <Toaster />
        </ThemeProvider>
      </div>
    ),
  ],
};

export default preview;
