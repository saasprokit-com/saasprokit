import { Section, Text } from "@react-email/components";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

type FeatureListVariant = "default" | "success" | "warning" | "error";

interface FeatureListProps {
  /** List title (optional) */
  title?: string;
  /** Features to display */
  features: string[];
  /** Visual variant */
  variant?: FeatureListVariant;
}

/**
 * FeatureList - Bulleted list of features
 *
 * Variants:
 * - default: Neutral colors
 * - success: Green (new features gained)
 * - warning: Yellow (features to note)
 * - error: Red (features being lost)
 *
 * Usage:
 * ```tsx
 * <FeatureList
 *   title="Features You'll Lose:"
 *   features={["Priority support", "Advanced analytics"]}
 *   variant="error"
 * />
 * ```
 */
export function FeatureList({
  title,
  features,
  variant = "default",
}: FeatureListProps) {
  const variantColors = getVariantColors(variant);

  const boxStyle = {
    backgroundColor: variantColors.background,
    borderRadius: spacing.borderRadius.default,
    padding: spacing[4],
    margin: "24px 0",
  };

  const titleStyle = {
    color: variantColors.titleText,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    margin: "0 0 8px",
  };

  const itemStyle = {
    color: variantColors.itemText,
    fontSize: typography.fontSize.sm,
    margin: "0 0 4px",
  };

  return (
    <Section style={boxStyle}>
      {title && <Text style={titleStyle}>{title}</Text>}
      {features.map((feature) => (
        <Text key={feature} style={itemStyle}>
          {variantColors.bullet} {feature}
        </Text>
      ))}
    </Section>
  );
}

function getVariantColors(variant: FeatureListVariant) {
  switch (variant) {
    case "success":
      return {
        background: colors.infoBox.green.background,
        titleText: colors.infoBox.green.text,
        itemText: "#16a34a",
        bullet: "✓",
      };
    case "warning":
      return {
        background: colors.infoBox.yellow.background,
        titleText: colors.infoBox.yellow.text,
        itemText: colors.infoBox.yellow.text,
        bullet: "•",
      };
    case "error":
      return {
        background: colors.infoBox.red.background,
        titleText: colors.infoBox.red.text,
        itemText: "#dc2626",
        bullet: "•",
      };
    default:
      return {
        background: colors.background.muted,
        titleText: colors.text.primary,
        itemText: colors.text.secondary,
        bullet: "•",
      };
  }
}
