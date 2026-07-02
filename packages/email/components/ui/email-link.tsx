import { Link } from "@react-email/components";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

interface EmailLinkProps {
  /** Link text (optional when showUrl is true) */
  children?: string;
  /** URL to link to */
  href: string;
  /** Whether to show the full URL (for email clients that don't support buttons) */
  showUrl?: boolean;
}

/**
 * EmailLink - Styled link component
 *
 * When showUrl is true, displays the link text followed by the raw URL
 * (useful for "Or copy and paste this URL" sections)
 */
export function EmailLink({ href, children, showUrl = false }: EmailLinkProps) {
  if (showUrl) {
    return (
      <Link href={href} style={urlStyle}>
        {href}
      </Link>
    );
  }

  return (
    <Link href={href} style={linkStyle}>
      {children}
    </Link>
  );
}

const linkStyle = {
  color: colors.link,
  fontSize: typography.fontSize.sm,
  textDecoration: "underline",
};

const urlStyle = {
  color: colors.link,
  fontSize: typography.fontSize.sm,
  wordBreak: "break-all" as const,
};
