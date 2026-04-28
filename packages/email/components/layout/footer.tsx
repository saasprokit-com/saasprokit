import { Hr, Text } from "@react-email/components";
import type { ReactNode } from "react";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

interface FooterProps {
  /** Main footer message */
  children?: ReactNode;
  /** App name for branding */
  appName?: string;
  /** Whether to show the default branding line */
  showBranding?: boolean;
  /** Support email address */
  supportEmail?: string;
}

export function Footer({
  children,
  appName = "SaaS App",
  showBranding = true,
  supportEmail,
}: FooterProps) {
  return (
    <>
      <Hr style={hrStyle} />
      {children && <Text style={footerStyle}>{children}</Text>}
      {supportEmail && (
        <Text style={footerStyle}>Need help? Contact us at {supportEmail}</Text>
      )}
      {showBranding && (
        <Text style={footerStyle}>
          This email was sent by {appName}. If you have any questions, please
          contact our support team.
        </Text>
      )}
    </>
  );
}

const hrStyle = {
  borderColor: colors.border.default,
  margin: "32px 0",
};

const footerStyle = {
  color: colors.text.footer, // Fixed: meets WCAG 4.5:1 contrast
  fontSize: typography.fontSize.sm,
  lineHeight: typography.lineHeight.snug,
  margin: "0 0 8px",
};
