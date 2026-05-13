import type { ThemeProviderProps } from "next-themes";
import { ThemeProvider as NextThemeProvider } from "next-themes";
import { DesignConfigProvider } from "./design-config";

export const ThemeProvider = ({
  children,
  ...properties
}: ThemeProviderProps) => (
  <NextThemeProvider
    attribute="class"
    defaultTheme="system"
    disableTransitionOnChange
    enableColorScheme={false}
    enableSystem
    {...properties}
  >
    <DesignConfigProvider>{children}</DesignConfigProvider>
  </NextThemeProvider>
);
