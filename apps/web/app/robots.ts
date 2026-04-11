import type { MetadataRoute } from "next";
import { siteConfig } from "../lib/seo-config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/", "/user/", "/_next/", "/private/"],
      },
      {
        // Googlebot-specific rules
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/auth/", "/user/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
