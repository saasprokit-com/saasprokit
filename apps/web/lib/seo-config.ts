import { configureSeo, type SiteConfig } from "@repo/seo";
import { env } from "@/lib/env";

// Site configuration - Update these values for your site
export const siteConfig: SiteConfig = {
  name: "SaaSProKit",
  description:
    "Production-ready SaaS boilerplate with auth, billing, organizations, and everything you need to launch your SaaS.",
  url: env.NEXT_PUBLIC_APP_URL,
  ogImage: "/og-image.png",
  locale: "en_US",
  twitterHandle: "@luannguyenbkit",
  author: {
    name: "SaaSProKit",
    url: "https://github.com/saasprokit-com/saasprokit",
  },
  links: {
    twitter: "https://twitter.com/saasprokit",
    github: "https://github.com/saasprokit-com/saasprokit",
  },
};

// Initialize SEO configuration
configureSeo(siteConfig);
