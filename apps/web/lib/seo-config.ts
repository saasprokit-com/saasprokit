import { configureSeo, type SiteConfig } from "@repo/seo";
import { env } from "@/lib/env";

// Site configuration - Update these values for your site
export const siteConfig: SiteConfig = {
  name: "Frontier Blog",
  description:
    "Discover insightful articles on technology, development, and innovation. Stay updated with the latest trends and best practices.",
  url: env.NEXT_PUBLIC_APP_URL,
  ogImage: "/og-image.png",
  locale: "en_US",
  twitterHandle: "@frontierblog",
  author: {
    name: "Frontier Team",
    url: "https://frontier.blog/about",
  },
  links: {
    twitter: "https://twitter.com/frontierblog",
    github: "https://github.com/frontierblog",
  },
};

// Initialize SEO configuration
configureSeo(siteConfig);
