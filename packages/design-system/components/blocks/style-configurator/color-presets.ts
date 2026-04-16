/**
 * Color presets for the style configurator.
 * Values sourced from shadcn/ui registry (OKLch format).
 *
 * Each base color defines the full gray scale (background, foreground,
 * card, border, muted, etc.) for both light and dark modes.
 *
 * Each accent color defines the primary + ring override.
 */

export type BaseColorName = "neutral" | "slate" | "zinc" | "stone" | "gray";
export type AccentColorName =
  | "amber"
  | "blue"
  | "green"
  | "orange"
  | "red"
  | "violet";
export type RadiusValue = "0" | "0.3" | "0.5" | "0.75" | "1.0";
export type FontName = "geist" | "inter" | "dm-sans" | "jakarta";
export type DensityValue = "compact" | "comfortable" | "spacious";

export interface StyleConfig {
  baseColor: BaseColorName;
  accent: AccentColorName;
  radius: RadiusValue;
  font: FontName;
  density: DensityValue;
}

export const DEFAULT_CONFIG: StyleConfig = {
  baseColor: "neutral",
  accent: "blue",
  radius: "0",
  font: "geist",
  density: "comfortable",
};

type ColorVars = Record<string, string>;

interface ThemeColors {
  light: ColorVars;
  dark: ColorVars;
}

export const BASE_COLORS: Record<BaseColorName, ThemeColors> = {
  neutral: {
    light: {
      "--background": "oklch(1 0 0)",
      "--foreground": "oklch(0.145 0 0)",
      "--card": "oklch(1 0 0)",
      "--card-foreground": "oklch(0.145 0 0)",
      "--popover": "oklch(1 0 0)",
      "--popover-foreground": "oklch(0.145 0 0)",
      "--secondary": "oklch(0.97 0 0)",
      "--secondary-foreground": "oklch(0.205 0 0)",
      "--muted": "oklch(0.97 0 0)",
      "--muted-foreground": "oklch(0.556 0 0)",
      "--accent": "oklch(0.97 0 0)",
      "--accent-foreground": "oklch(0.205 0 0)",
      "--border": "oklch(0.922 0 0)",
      "--input": "oklch(0.922 0 0)",
    },
    dark: {
      "--background": "oklch(0.145 0 0)",
      "--foreground": "oklch(0.985 0 0)",
      "--card": "oklch(0.145 0 0)",
      "--card-foreground": "oklch(0.985 0 0)",
      "--popover": "oklch(0.145 0 0)",
      "--popover-foreground": "oklch(0.985 0 0)",
      "--secondary": "oklch(0.269 0 0)",
      "--secondary-foreground": "oklch(0.985 0 0)",
      "--muted": "oklch(0.269 0 0)",
      "--muted-foreground": "oklch(0.708 0 0)",
      "--accent": "oklch(0.269 0 0)",
      "--accent-foreground": "oklch(0.985 0 0)",
      "--border": "oklch(0.269 0 0)",
      "--input": "oklch(0.269 0 0)",
    },
  },
  slate: {
    light: {
      "--background": "oklch(1 0 0)",
      "--foreground": "oklch(0.129 0.042 264.052)",
      "--card": "oklch(1 0 0)",
      "--card-foreground": "oklch(0.129 0.042 264.052)",
      "--popover": "oklch(1 0 0)",
      "--popover-foreground": "oklch(0.129 0.042 264.052)",
      "--secondary": "oklch(0.968 0.007 264.536)",
      "--secondary-foreground": "oklch(0.208 0.042 265.755)",
      "--muted": "oklch(0.968 0.007 264.536)",
      "--muted-foreground": "oklch(0.554 0.022 257.417)",
      "--accent": "oklch(0.968 0.007 264.536)",
      "--accent-foreground": "oklch(0.208 0.042 265.755)",
      "--border": "oklch(0.924 0.008 264.531)",
      "--input": "oklch(0.924 0.008 264.531)",
    },
    dark: {
      "--background": "oklch(0.129 0.042 264.052)",
      "--foreground": "oklch(0.985 0.002 247.839)",
      "--card": "oklch(0.129 0.042 264.052)",
      "--card-foreground": "oklch(0.985 0.002 247.839)",
      "--popover": "oklch(0.129 0.042 264.052)",
      "--popover-foreground": "oklch(0.985 0.002 247.839)",
      "--secondary": "oklch(0.263 0.033 260.844)",
      "--secondary-foreground": "oklch(0.985 0.002 247.839)",
      "--muted": "oklch(0.263 0.033 260.844)",
      "--muted-foreground": "oklch(0.704 0.015 261.285)",
      "--accent": "oklch(0.263 0.033 260.844)",
      "--accent-foreground": "oklch(0.985 0.002 247.839)",
      "--border": "oklch(0.263 0.033 260.844)",
      "--input": "oklch(0.263 0.033 260.844)",
    },
  },
  zinc: {
    light: {
      "--background": "oklch(1 0 0)",
      "--foreground": "oklch(0.141 0.005 285.823)",
      "--card": "oklch(1 0 0)",
      "--card-foreground": "oklch(0.141 0.005 285.823)",
      "--popover": "oklch(1 0 0)",
      "--popover-foreground": "oklch(0.141 0.005 285.823)",
      "--secondary": "oklch(0.967 0.001 286.375)",
      "--secondary-foreground": "oklch(0.21 0.006 285.885)",
      "--muted": "oklch(0.967 0.001 286.375)",
      "--muted-foreground": "oklch(0.552 0.016 285.938)",
      "--accent": "oklch(0.967 0.001 286.375)",
      "--accent-foreground": "oklch(0.21 0.006 285.885)",
      "--border": "oklch(0.92 0.004 286.32)",
      "--input": "oklch(0.92 0.004 286.32)",
    },
    dark: {
      "--background": "oklch(0.141 0.005 285.823)",
      "--foreground": "oklch(0.985 0.002 247.839)",
      "--card": "oklch(0.141 0.005 285.823)",
      "--card-foreground": "oklch(0.985 0.002 247.839)",
      "--popover": "oklch(0.141 0.005 285.823)",
      "--popover-foreground": "oklch(0.985 0.002 247.839)",
      "--secondary": "oklch(0.268 0.007 286.029)",
      "--secondary-foreground": "oklch(0.985 0.002 247.839)",
      "--muted": "oklch(0.268 0.007 286.029)",
      "--muted-foreground": "oklch(0.705 0.015 286.067)",
      "--accent": "oklch(0.268 0.007 286.029)",
      "--accent-foreground": "oklch(0.985 0.002 247.839)",
      "--border": "oklch(0.268 0.007 286.029)",
      "--input": "oklch(0.268 0.007 286.029)",
    },
  },
  stone: {
    light: {
      "--background": "oklch(1 0 0)",
      "--foreground": "oklch(0.147 0.004 49.25)",
      "--card": "oklch(1 0 0)",
      "--card-foreground": "oklch(0.147 0.004 49.25)",
      "--popover": "oklch(1 0 0)",
      "--popover-foreground": "oklch(0.147 0.004 49.25)",
      "--secondary": "oklch(0.97 0.001 106.424)",
      "--secondary-foreground": "oklch(0.216 0.006 56.043)",
      "--muted": "oklch(0.97 0.001 106.424)",
      "--muted-foreground": "oklch(0.553 0.013 58.071)",
      "--accent": "oklch(0.97 0.001 106.424)",
      "--accent-foreground": "oklch(0.216 0.006 56.043)",
      "--border": "oklch(0.923 0.003 48.717)",
      "--input": "oklch(0.923 0.003 48.717)",
    },
    dark: {
      "--background": "oklch(0.147 0.004 49.25)",
      "--foreground": "oklch(0.985 0.001 106.423)",
      "--card": "oklch(0.147 0.004 49.25)",
      "--card-foreground": "oklch(0.985 0.001 106.423)",
      "--popover": "oklch(0.147 0.004 49.25)",
      "--popover-foreground": "oklch(0.985 0.001 106.423)",
      "--secondary": "oklch(0.268 0.007 34.298)",
      "--secondary-foreground": "oklch(0.985 0.001 106.423)",
      "--muted": "oklch(0.268 0.007 34.298)",
      "--muted-foreground": "oklch(0.709 0.01 56.259)",
      "--accent": "oklch(0.268 0.007 34.298)",
      "--accent-foreground": "oklch(0.985 0.001 106.423)",
      "--border": "oklch(0.268 0.007 34.298)",
      "--input": "oklch(0.268 0.007 34.298)",
    },
  },
  gray: {
    light: {
      "--background": "oklch(1 0 0)",
      "--foreground": "oklch(0.13 0.028 261.692)",
      "--card": "oklch(1 0 0)",
      "--card-foreground": "oklch(0.13 0.028 261.692)",
      "--popover": "oklch(1 0 0)",
      "--popover-foreground": "oklch(0.13 0.028 261.692)",
      "--secondary": "oklch(0.968 0.007 264.536)",
      "--secondary-foreground": "oklch(0.195 0.023 257.281)",
      "--muted": "oklch(0.968 0.007 264.536)",
      "--muted-foreground": "oklch(0.55 0.023 257.281)",
      "--accent": "oklch(0.968 0.007 264.536)",
      "--accent-foreground": "oklch(0.195 0.023 257.281)",
      "--border": "oklch(0.919 0.007 264.536)",
      "--input": "oklch(0.919 0.007 264.536)",
    },
    dark: {
      "--background": "oklch(0.13 0.028 261.692)",
      "--foreground": "oklch(0.985 0.002 247.839)",
      "--card": "oklch(0.13 0.028 261.692)",
      "--card-foreground": "oklch(0.985 0.002 247.839)",
      "--popover": "oklch(0.13 0.028 261.692)",
      "--popover-foreground": "oklch(0.985 0.002 247.839)",
      "--secondary": "oklch(0.262 0.023 257.281)",
      "--secondary-foreground": "oklch(0.985 0.002 247.839)",
      "--muted": "oklch(0.262 0.023 257.281)",
      "--muted-foreground": "oklch(0.705 0.015 261.285)",
      "--accent": "oklch(0.262 0.023 257.281)",
      "--accent-foreground": "oklch(0.985 0.002 247.839)",
      "--border": "oklch(0.262 0.023 257.281)",
      "--input": "oklch(0.262 0.023 257.281)",
    },
  },
};

export const ACCENT_COLORS: Record<
  AccentColorName,
  { light: ColorVars; dark: ColorVars; preview: string }
> = {
  amber: {
    light: {
      "--primary": "oklch(0.769 0.188 70.08)",
      "--primary-foreground": "oklch(0.145 0 0)",
      "--ring": "oklch(0.769 0.188 70.08)",
    },
    dark: {
      "--primary": "oklch(0.828 0.189 84.429)",
      "--primary-foreground": "oklch(0.145 0 0)",
      "--ring": "oklch(0.828 0.189 84.429)",
    },
    preview: "#F59E0B",
  },
  blue: {
    light: {
      "--primary": "oklch(0.546 0.245 262.881)",
      "--primary-foreground": "oklch(0.985 0.002 247.839)",
      "--ring": "oklch(0.546 0.245 262.881)",
    },
    dark: {
      "--primary": "oklch(0.623 0.214 259.815)",
      "--primary-foreground": "oklch(0.145 0 0)",
      "--ring": "oklch(0.623 0.214 259.815)",
    },
    preview: "#3b82f6",
  },
  green: {
    light: {
      "--primary": "oklch(0.527 0.154 150.069)",
      "--primary-foreground": "oklch(0.985 0.002 247.839)",
      "--ring": "oklch(0.527 0.154 150.069)",
    },
    dark: {
      "--primary": "oklch(0.627 0.194 149.214)",
      "--primary-foreground": "oklch(0.145 0 0)",
      "--ring": "oklch(0.627 0.194 149.214)",
    },
    preview: "#22c55e",
  },
  orange: {
    light: {
      "--primary": "oklch(0.646 0.222 41.116)",
      "--primary-foreground": "oklch(0.985 0.002 247.839)",
      "--ring": "oklch(0.646 0.222 41.116)",
    },
    dark: {
      "--primary": "oklch(0.702 0.183 46.604)",
      "--primary-foreground": "oklch(0.145 0 0)",
      "--ring": "oklch(0.702 0.183 46.604)",
    },
    preview: "#f97316",
  },
  red: {
    light: {
      "--primary": "oklch(0.577 0.245 27.325)",
      "--primary-foreground": "oklch(0.985 0.002 247.839)",
      "--ring": "oklch(0.577 0.245 27.325)",
    },
    dark: {
      "--primary": "oklch(0.637 0.237 25.331)",
      "--primary-foreground": "oklch(0.145 0 0)",
      "--ring": "oklch(0.637 0.237 25.331)",
    },
    preview: "#ef4444",
  },
  violet: {
    light: {
      "--primary": "oklch(0.541 0.281 293.009)",
      "--primary-foreground": "oklch(0.985 0.002 247.839)",
      "--ring": "oklch(0.541 0.281 293.009)",
    },
    dark: {
      "--primary": "oklch(0.624 0.247 292.717)",
      "--primary-foreground": "oklch(0.145 0 0)",
      "--ring": "oklch(0.624 0.247 292.717)",
    },
    preview: "#8b5cf6",
  },
};

export const FONT_OPTIONS: Record<
  FontName,
  { label: string; family: string; googleUrl?: string }
> = {
  geist: {
    label: "Geist",
    family: "var(--font-geist-sans)",
  },
  inter: {
    label: "Inter",
    family: "'Inter', sans-serif",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  },
  "dm-sans": {
    label: "DM Sans",
    family: "'DM Sans', sans-serif",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
  },
  jakarta: {
    label: "Plus Jakarta Sans",
    family: "'Plus Jakarta Sans', sans-serif",
    googleUrl:
      "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
  },
};

export const RADIUS_OPTIONS: { value: RadiusValue; label: string }[] = [
  { value: "0", label: "0" },
  { value: "0.3", label: "0.3" },
  { value: "0.5", label: "0.5" },
  { value: "0.75", label: "0.75" },
  { value: "1.0", label: "1.0" },
];

export const DENSITY_OPTIONS: {
  value: DensityValue;
  label: string;
  scale: number;
}[] = [
  { value: "compact", label: "Compact", scale: 0.75 },
  { value: "comfortable", label: "Comfortable", scale: 1 },
  { value: "spacious", label: "Spacious", scale: 1.25 },
];
