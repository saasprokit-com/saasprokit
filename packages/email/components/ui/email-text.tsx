import { Text } from "@react-email/components";
import type { ReactNode } from "react";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

interface EmailTextProps {
  /** Text content */
  children: ReactNode;
  /** Custom margin override */
  margin?: string;
  /** Text variant */
  variant?: "default" | "small" | "muted";
}

/**
 * EmailText - Styled text component
 *
 * Variants:
 * - default: Standard body text
 * - small: Smaller text for secondary info
 * - muted: Gray text for less important info
 */
export function EmailText({
  variant = "default",
  children,
  margin,
}: EmailTextProps) {
  const baseStyle = variantStyles[variant];
  const style = margin ? { ...baseStyle, margin } : baseStyle;

  return <Text style={style}>{children}</Text>;
}

const variantStyles = {
  default: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.normal,
    margin: "0 0 16px",
  },
  small: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.snug,
    margin: "0 0 12px",
  },
  muted: {
    color: colors.text.muted,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.snug,
    margin: "0 0 12px",
  },
};
