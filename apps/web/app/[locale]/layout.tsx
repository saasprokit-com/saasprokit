import { Toaster } from "@repo/design-system/components/ui/sonner";
import { MotionProvider } from "@repo/design-system/providers/motion";
import { ThemeProvider } from "@repo/design-system/providers/theme";
import { locales } from "@repo/internationalization";
import {
  createMetadata,
  generateOrganizationSchema,
  generateWebSiteSchema,
  JsonLd,
} from "@repo/seo";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { siteConfig } from "@/lib/seo-config";

// Export metadata for SEO
export const metadata = createMetadata(
  { description: siteConfig.description },
  siteConfig
);

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

interface LocaleLayoutProps {
  readonly children: ReactNode;
  readonly params: Promise<{
    locale: string;
  }>;
}

const LocaleLayout = async ({ children, params }: LocaleLayoutProps) => {
  const { locale } = await params;

  if (!(locales as readonly string[]).includes(locale)) {
    notFound();
  }

  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? undefined;

  return (
    <>
      <JsonLd code={generateOrganizationSchema(siteConfig)} />
      <JsonLd code={generateWebSiteSchema(siteConfig)} />
      <ThemeProvider nonce={nonce}>
        <MotionProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
        </MotionProvider>
        <Toaster closeButton position="top-right" richColors />
      </ThemeProvider>
    </>
  );
};

export default LocaleLayout;
