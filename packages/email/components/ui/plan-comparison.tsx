import { Column, Row, Section, Text } from "@react-email/components";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

type PlanComparisonProps = {
  /** Previous plan name */
  previousPlan: string;
  /** New plan name */
  newPlan: string;
  /** Whether this is an upgrade (true) or downgrade (false) */
  isUpgrade?: boolean;
};

/**
 * PlanComparison - Shows plan change with arrow
 *
 * Uses table-based layout for Outlook compatibility (no flex!)
 *
 * Usage:
 * ```tsx
 * <PlanComparison
 *   previousPlan="Pro"
 *   newPlan="Enterprise"
 *   isUpgrade={true}
 * />
 * ```
 */
export function PlanComparison({
  previousPlan,
  newPlan,
  isUpgrade = true,
}: PlanComparisonProps) {
  return (
    <Section style={boxStyle}>
      <Row>
        <Column style={columnStyle}>
          <Text style={labelStyle}>Previous Plan</Text>
          <Text style={isUpgrade ? planNameStyle : previousPlanStyle}>
            {previousPlan}
          </Text>
        </Column>
        <Column style={arrowColumnStyle}>
          <Text style={arrowStyle}>→</Text>
        </Column>
        <Column style={columnStyle}>
          <Text style={labelStyle}>New Plan</Text>
          <Text style={isUpgrade ? newPlanStyle : planNameStyle}>
            {newPlan}
          </Text>
        </Column>
      </Row>
    </Section>
  );
}

const boxStyle = {
  backgroundColor: colors.background.muted,
  borderRadius: spacing.borderRadius.default,
  padding: spacing[5],
  margin: "24px 0",
};

const columnStyle = {
  textAlign: "center" as const,
  width: "40%",
};

const arrowColumnStyle = {
  textAlign: "center" as const,
  width: "20%",
  verticalAlign: "middle" as const,
};

const labelStyle = {
  color: colors.text.muted,
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.semibold,
  textTransform: "uppercase" as const,
  margin: "0 0 4px",
};

const planNameStyle = {
  color: colors.text.primary,
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.semibold,
  margin: "0",
};

// For downgrades, show previous plan with strikethrough
const previousPlanStyle = {
  color: colors.strikethrough,
  fontSize: typography.fontSize.base,
  textDecoration: "line-through",
  margin: "0",
};

// For upgrades, show new plan with emphasis
const newPlanStyle = {
  color: colors.text.primary,
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.bold,
  margin: "0",
};

const arrowStyle = {
  fontSize: typography.fontSize["2xl"],
  color: colors.arrow,
  margin: "0",
};
