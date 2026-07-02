import { Section, Text } from "@react-email/components";
import type { ReactNode } from "react";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

interface DetailItemProps {
  /** Whether this is the last item (removes bottom margin) */
  isLast?: boolean;
  /** Label text (e.g., "Plan", "Amount", "Date") */
  label: string;
  /** Value to display */
  value: ReactNode;
}

/**
 * DetailItem - Single label/value pair for use inside DetailsBox
 */
export function DetailItem({ label, value, isLast = false }: DetailItemProps) {
  return (
    <>
      <Text style={labelStyle}>{label}</Text>
      <Text style={{ ...valueStyle, margin: isLast ? "0" : "0 0 16px" }}>
        {value}
      </Text>
    </>
  );
}

interface DetailsBoxProps {
  /** Detail items as children */
  children: ReactNode;
}

/**
 * DetailsBox - Gray box containing label/value pairs
 *
 * Usage:
 * ```tsx
 * <DetailsBox>
 *   <DetailItem label="Plan" value="Pro" />
 *   <DetailItem label="Amount" value="$19.00" />
 *   <DetailItem label="Billing Period" value="Monthly" isLast />
 * </DetailsBox>
 * ```
 */
export function DetailsBox({ children }: DetailsBoxProps) {
  return <Section style={boxStyle}>{children}</Section>;
}

const boxStyle = {
  backgroundColor: colors.background.muted,
  borderRadius: spacing.borderRadius.default,
  padding: spacing[5],
  margin: "24px 0",
};

const labelStyle = {
  color: colors.text.muted,
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.semibold,
  textTransform: "uppercase" as const,
  margin: "0 0 4px",
};

const valueStyle = {
  color: colors.text.primary,
  fontSize: typography.fontSize.sm,
  margin: "0 0 16px",
};
