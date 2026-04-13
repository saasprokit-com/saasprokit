import { Heading as ReactEmailHeading } from "@react-email/components";
import type { ReactNode } from "react";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

type HeadingProps = {
  /** Heading level (1 or 2) */
  as?: "h1" | "h2";
  /** Heading content */
  children: ReactNode;
  /** Whether to center the heading */
  centered?: boolean;
};

/**
 * Heading - Styled heading component
 *
 * Provides consistent heading styles across templates.
 */
export function Heading({
  as = "h1",
  children,
  centered = true,
}: HeadingProps) {
  const style = as === "h1" ? h1Style : h2Style;
  const finalStyle = centered
    ? style
    : { ...style, textAlign: "left" as const };

  return (
    <ReactEmailHeading as={as} style={finalStyle}>
      {children}
    </ReactEmailHeading>
  );
}

const h1Style = {
  color: colors.text.primary,
  fontSize: typography.fontSize["2xl"],
  fontWeight: typography.fontWeight.bold,
  lineHeight: typography.lineHeight.relaxed,
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const h2Style = {
  color: colors.text.primary,
  fontSize: typography.fontSize.xl,
  fontWeight: typography.fontWeight.bold,
  lineHeight: typography.lineHeight.relaxed,
  margin: "0 0 16px",
  textAlign: "center" as const,
};
