import { Toaster } from "@repo/design-system/components/ui/sonner";
import { ThemeProvider } from "@repo/design-system/providers/theme";
import { locales } from "@repo/internationalization";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  getDefaultMetadata,
  JsonLd,
} from "@repo/seo";
import { headers } from "next/headers";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
// Import seo-config to initialize SEO configuration
import "../../lib/seo-config";

// Export metadata for SEO
export const metadata = getDefaultMetadata();

// Viewport configuration
export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type LocaleLayoutProps = {
  readonly children: ReactNode;
  readonly params: Promise<{
    locale: string;
  }>;
};

const LocaleLayout = async ({ children, params }: LocaleLayoutProps) => {
  await params;
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? undefined;

  return (
    <>
      <JsonLd code={generateOrganizationSchema()} />
      <JsonLd code={generateWebSiteSchema()} />
      <ThemeProvider nonce={nonce}>
        <NuqsAdapter>{children}</NuqsAdapter>
        <Toaster closeButton position="top-right" richColors />
      </ThemeProvider>
    </>
  );
};

export default LocaleLayout;
