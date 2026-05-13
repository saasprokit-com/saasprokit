import { Body, Container, Head, Html, Preview } from "@react-email/components";
import type { ReactNode } from "react";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { Footer } from "./footer";

interface EmailLayoutProps {
  /** Preview text shown in inbox */
  preview: string;
  /** Email content */
  children: ReactNode;
  /** Footer content (optional) */
  footerContent?: ReactNode;
  /** App name for footer branding */
  appName?: string;
  /** Whether to show footer */
  showFooter?: boolean;
  /** Support email for footer */
  supportEmail?: string;
}

/**
 * EmailLayout - Base layout wrapper for all email templates
 *
 * Provides consistent:
 * - HTML structure
 * - Background styling
 * - Container with white card
 * - Footer with branding
 */
export function EmailLayout({
  preview,
  children,
  footerContent,
  appName = "SaaS App",
  showFooter = true,
  supportEmail,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head>
        {/* Color scheme meta for dark mode support */}
        <meta content="light" name="color-scheme" />
        <meta content="light" name="supported-color-schemes" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {children}
          {showFooter && (
            <Footer appName={appName} supportEmail={supportEmail}>
              {footerContent}
            </Footer>
          )}
        </Container>
      </Body>
    </Html>
  );
}

const mainStyle = {
  backgroundColor: colors.background.main,
  fontFamily: typography.fontFamily,
};

const containerStyle = {
  backgroundColor: colors.background.container,
  margin: spacing.container.margin,
  padding: spacing.container.padding,
  maxWidth: spacing.container.maxWidth,
  borderRadius: spacing.borderRadius.default,
};
