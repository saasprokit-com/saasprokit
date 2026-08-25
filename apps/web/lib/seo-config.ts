import { configureSeo, type SiteConfig } from "@repo/seo";
import { env } from "@/lib/env";

// Site configuration - Update these values for your site
export const siteConfig: SiteConfig = {
  name: env.NEXT_PUBLIC_APP_NAME,
  description: `${env.NEXT_PUBLIC_APP_NAME} — multi-organization SaaS platform.`,
  url: env.NEXT_PUBLIC_APP_URL,
  ogImage: "/og-image.png",
  locale: "en_US",
};

// Initialize SEO configuration
configureSeo(siteConfig);
