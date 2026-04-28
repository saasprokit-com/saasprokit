import { Button, Section } from "@react-email/components";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

type ButtonVariant = "primary" | "secondary" | "danger" | "success";

interface EmailButtonProps {
  /** Button variant determines colors */
  variant?: ButtonVariant;
  /** URL the button links to */
  href: string;
  /** Button text */
  children: string;
  /** Whether to center the button */
  centered?: boolean;
}

/**
 * EmailButton - Styled button for email templates
 *
 * Variants:
 * - primary: Indigo (default)
 * - secondary: Gray
 * - danger: Red
 * - success: Green
 */
export function EmailButton({
  variant = "primary",
  href,
  children,
  centered = true,
}: EmailButtonProps) {
  const variantColors = colors.button[variant];

  const buttonStyle = {
    backgroundColor: variantColors.background,
    borderRadius: spacing.borderRadius.default,
    color: variantColors.text,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "12px 32px",
  };

  const button = (
    <Button href={href} style={buttonStyle}>
      {children}
    </Button>
  );

  if (centered) {
    return <Section style={containerStyle}>{button}</Section>;
  }

  return button;
}

const containerStyle = {
  textAlign: "center" as const,
  margin: "32px 0",
};
