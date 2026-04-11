/**
 * Email spacing system - consistent across all templates
 */
export const spacing = {
  // Base spacing scale
  0: "0",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",

  // Container
  container: {
    maxWidth: "560px",
    padding: "40px 20px",
    margin: "0 auto",
  },

  // Border radius
  borderRadius: {
    none: "0",
    sm: "4px",
    default: "8px",
    lg: "12px",
    full: "9999px",
  },
} as const;

export type Spacing = typeof spacing;
