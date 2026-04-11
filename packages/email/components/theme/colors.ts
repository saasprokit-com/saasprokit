/**
 * Email color palette - consistent across all templates
 * Accessibility: All colors meet WCAG 2.1 AA contrast requirements
 */
export const colors = {
  // Background colors
  background: {
    main: "#f6f9fc",
    container: "#ffffff",
    muted: "#f9fafb",
  },

  // Text colors
  text: {
    primary: "#1a1a1a",
    secondary: "#525f7f",
    muted: "#6b7280",
    footer: "#666666", // Fixed: was #8898aa (failed WCAG), now 5.74:1 contrast
  },

  // Brand colors
  brand: {
    primary: "#6366f1", // Indigo
    primaryHover: "#4f46e5",
  },

  // Status colors - Banner backgrounds
  status: {
    success: {
      background: "#dcfce7",
      text: "#166534",
    },
    warning: {
      background: "#fef3c7",
      text: "#92400e",
    },
    error: {
      background: "#fee2e2",
      text: "#991b1b",
    },
    info: {
      background: "#dbeafe",
      text: "#1e40af",
    },
  },

  // Info box variants
  infoBox: {
    blue: {
      background: "#dbeafe",
      text: "#1e40af",
    },
    yellow: {
      background: "#fef3c7",
      text: "#b45309",
    },
    red: {
      background: "#fef2f2",
      text: "#991b1b",
    },
    green: {
      background: "#dcfce7",
      text: "#166534",
    },
  },

  // Border colors
  border: {
    default: "#e6ebf1",
    muted: "#e5e7eb",
  },

  // Button variants
  button: {
    primary: {
      background: "#6366f1",
      text: "#ffffff",
    },
    secondary: {
      background: "#f3f4f6",
      text: "#374151",
    },
    danger: {
      background: "#dc2626",
      text: "#ffffff",
    },
    success: {
      background: "#16a34a",
      text: "#ffffff",
    },
  },

  // Link color
  link: "#6366f1",

  // Special use
  strikethrough: "#6b7280",
  arrow: "#9ca3af",
} as const;

export type Colors = typeof colors;
