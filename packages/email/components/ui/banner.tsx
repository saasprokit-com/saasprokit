import { Section, Text } from "@react-email/components";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

type BannerVariant = "success" | "warning" | "error" | "info";

interface BannerProps {
  /** Banner variant determines colors */
  variant: BannerVariant;
  /** Text to display in the banner */
  children: string;
}

/**
 * Banner - Status banner shown at the top of emails
 *
 * Variants:
 * - success: Green (Payment Successful, Welcome, etc.)
 * - warning: Yellow (Plan Changed, Trial Ending, etc.)
 * - error: Red (Account Locked, Payment Failed, etc.)
 * - info: Blue (New Login, Invitation, etc.)
 */
export function Banner({ variant, children }: BannerProps) {
  const variantColors = colors.status[variant];

  const bannerStyle = {
    backgroundColor: variantColors.background,
    borderRadius: spacing.borderRadius.default,
    padding: spacing[3],
    marginBottom: spacing[6],
    textAlign: "center" as const,
  };

  const textStyle = {
    color: variantColors.text,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    margin: "0",
  };

  return (
    <Section style={bannerStyle}>
      <Text style={textStyle}>{children}</Text>
    </Section>
  );
}
