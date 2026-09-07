import { colors } from "./colors";
import { typography } from "./typography";

/**
 * Base styles - reusable across all templates
 * These eliminate the need for duplicated style objects
 */
export const baseStyles = {
  // Main body style
  main: {
    backgroundColor: colors.background.main,
    fontFamily: typography.fontFamily,
  },

  // Container style
  container: {
    backgroundColor: colors.background.container,
    margin: "0 auto",
    padding: "40px 20px",
    maxWidth: "560px",
    borderRadius: "8px",
  },

  // Heading styles
  h1: {
    color: colors.text.primary,
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.relaxed,
    margin: "0 0 24px",
    textAlign: "center" as const,
  },

  h2: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.relaxed,
    margin: "0 0 16px",
  },

  // Text styles
  text: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.normal,
    margin: "0 0 16px",
  },

  textSmall: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.snug,
    margin: "0 0 12px",
  },

  // Link style
  link: {
    color: colors.link,
    fontSize: typography.fontSize.sm,
    wordBreak: "break-all" as const,
  },

  // Horizontal rule
  hr: {
    borderColor: colors.border.default,
    margin: "32px 0",
  },

  // Footer style - fixed for WCAG compliance
  footer: {
    color: colors.text.footer,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.snug,
    margin: "0 0 8px",
  },

  // Button container (centered)
  buttonContainer: {
    textAlign: "center" as const,
    margin: "32px 0",
  },

  // Details box (gray background with label/value pairs)
  detailsBox: {
    backgroundColor: colors.background.muted,
    borderRadius: "8px",
    padding: "20px",
    margin: "24px 0",
  },

  detailLabel: {
    color: colors.text.muted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textTransform: "uppercase" as const,
    margin: "0 0 4px",
  },

  detailValue: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    margin: "0 0 16px",
  },
} as const;

export type BaseStyles = typeof baseStyles;
