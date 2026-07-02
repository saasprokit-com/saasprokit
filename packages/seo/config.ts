export interface SiteConfig {
  author?: { name: string; url?: string };
  description: string;
  links?: { twitter?: string; github?: string };
  locale?: string;
  name: string;
  ogImage?: string;
  twitterHandle?: string;
  url: string;
}

let _siteConfig: SiteConfig | null = null;

export const configureSeo = (config: SiteConfig): void => {
  _siteConfig = config;
};

export const getSiteConfig = (): SiteConfig => {
  if (!_siteConfig) {
    throw new Error("SEO not configured. Call configureSeo() first.");
  }
  return _siteConfig;
};
