import { Column, Hr, Row, Section, Text } from "@react-email/components";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

type LineItemProps = {
  label: string;
  value: string;
  isTotal?: boolean;
};

type ReceiptTableProps = {
  /** Company/App name */
  companyName?: string;
  /** Invoice number */
  invoiceNumber?: string;
  /** Line items */
  items: LineItemProps[];
  /** Total amount */
  total: string;
};

/**
 * ReceiptTable - Payment receipt table with Outlook-compatible layout
 *
 * Uses table-based Row/Column instead of flex for email client compatibility.
 *
 * Usage:
 * ```tsx
 * <ReceiptTable
 *   companyName="SaaS App"
 *   invoiceNumber="INV-2024-001234"
 *   items={[
 *     { label: "Pro Plan", value: "$19.00" },
 *     { label: "Billing Period", value: "Dec - Jan" },
 *   ]}
 *   total="$19.00"
 * />
 * ```
 */
export function ReceiptTable({
  companyName = "SaaS App",
  invoiceNumber,
  items,
  total,
}: ReceiptTableProps) {
  return (
    <Section style={receiptBoxStyle}>
      {/* Header */}
      <Section style={receiptHeaderStyle}>
        <Text style={receiptTitleStyle}>{companyName}</Text>
        {invoiceNumber && (
          <Text style={invoiceTextStyle}>Invoice #{invoiceNumber}</Text>
        )}
      </Section>

      {/* Body */}
      <Section style={receiptBodyStyle}>
        {items.map((item) => (
          <Row key={`${item.label}-${item.value}`} style={lineItemRowStyle}>
            <Column style={labelColumnStyle}>
              <Text style={lineItemLabelStyle}>{item.label}</Text>
            </Column>
            <Column style={valueColumnStyle}>
              <Text style={lineItemValueStyle}>{item.value}</Text>
            </Column>
          </Row>
        ))}

        <Hr style={receiptDividerStyle} />

        {/* Total row */}
        <Row style={lineItemRowStyle}>
          <Column style={labelColumnStyle}>
            <Text style={totalLabelStyle}>Total Paid</Text>
          </Column>
          <Column style={valueColumnStyle}>
            <Text style={totalValueStyle}>{total}</Text>
          </Column>
        </Row>
      </Section>
    </Section>
  );
}

const receiptBoxStyle = {
  border: `1px solid ${colors.border.default}`,
  borderRadius: spacing.borderRadius.default,
  margin: "24px 0",
  overflow: "hidden",
};

const receiptHeaderStyle = {
  backgroundColor: colors.background.muted,
  padding: "16px 20px",
  borderBottom: `1px solid ${colors.border.default}`,
};

const receiptTitleStyle = {
  color: colors.text.primary,
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.semibold,
  margin: "0 0 4px",
};

const invoiceTextStyle = {
  color: colors.text.muted,
  fontSize: typography.fontSize.xs,
  margin: "0",
};

const receiptBodyStyle = {
  padding: spacing[5],
};

const lineItemRowStyle = {
  marginBottom: spacing[3],
};

const labelColumnStyle = {
  width: "60%",
};

const valueColumnStyle = {
  width: "40%",
  textAlign: "right" as const,
};

const lineItemLabelStyle = {
  color: colors.text.secondary,
  fontSize: typography.fontSize.sm,
  margin: "0",
};

const lineItemValueStyle = {
  color: colors.text.primary,
  fontSize: typography.fontSize.sm,
  margin: "0",
};

const receiptDividerStyle = {
  borderColor: colors.border.default,
  margin: "16px 0",
};

const totalLabelStyle = {
  color: colors.text.primary,
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.semibold,
  margin: "0",
};

const totalValueStyle = {
  color: colors.text.primary,
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.semibold,
  margin: "0",
};
