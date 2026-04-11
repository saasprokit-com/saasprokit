import { Section, Text } from "@react-email/components";
import type { ReactNode } from "react";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

type InfoBoxVariant = "blue" | "yellow" | "red" | "green";

type InfoBoxProps = {
  /** Variant determines colors */
  variant?: InfoBoxVariant;
  /** Optional title/heading */
  title?: string;
  /** Content - can be string or ReactNode */
  children: ReactNode;
};

/**
 * InfoBox - Colored info/warning/alert box
 *
 * Variants:
 * - blue: Informational messages
 * - yellow: Warnings, important notices
 * - red: Errors, critical warnings, lost features
 * - green: Success confirmations
 *
 * Usage:
 * ```tsx
 * <InfoBox variant="yellow" title="Important">
 *   Your trial ends in 3 days.
 * </InfoBox>
 *
 * <InfoBox variant="red" title="Features You'll Lose:">
 *   <ul>
 *     <li>Priority support</li>
 *     <li>Advanced analytics</li>
 *   </ul>
 * </InfoBox>
 * ```
 */
export function InfoBox({ variant = "blue", title, children }: InfoBoxProps) {
  const variantColors = colors.infoBox[variant];

  const boxStyle = {
    backgroundColor: variantColors.background,
    borderRadius: spacing.borderRadius.default,
    padding: spacing[4],
    margin: "24px 0",
  };

  const titleStyle = {
    color: variantColors.text,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    margin: title ? "0 0 8px" : "0",
  };

  const contentStyle = {
    color: variantColors.text,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.snug,
    margin: "0",
  };

  return (
    <Section style={boxStyle}>
      {title && <Text style={titleStyle}>{title}</Text>}
      {typeof children === "string" ? (
        <Text style={contentStyle}>{children}</Text>
      ) : (
        children
      )}
    </Section>
  );
}
