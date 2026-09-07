/**
 * Email typography system - consistent across all templates
 */
export const typography = {
  // Font family stack - email-safe fonts
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',

  // Font sizes
  fontSize: {
    xs: "12px",
    sm: "14px",
    base: "16px",
    lg: "18px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "30px",
  },

  // Font weights
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },

  // Line heights
  lineHeight: {
    tight: "20px",
    snug: "22px",
    normal: "26px",
    relaxed: "32px",
  },
} as const;

export type Typography = typeof typography;
