import type { Organization, WebSite, WithContext } from "schema-dts";
import type { SiteConfig } from "./metadata";

// Organization JSON-LD Schema
export function generateOrganizationSchema(
  config: SiteConfig
): WithContext<Organization> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: config.name,
    url: config.url,
    logo: `${config.url}/logo.png`,
    sameAs: [config.links?.twitter, config.links?.github].filter(
      (link): link is string => Boolean(link)
    ),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      availableLanguage: ["English"],
    },
  };
}

// WebSite JSON-LD Schema (for search box)
export function generateWebSiteSchema(
  config: SiteConfig
): WithContext<WebSite> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: config.name,
    url: config.url,
    description: config.description,
    publisher: {
      "@type": "Organization",
      name: config.name,
      url: config.url,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${config.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    } as unknown as WebSite["potentialAction"],
  };
}
