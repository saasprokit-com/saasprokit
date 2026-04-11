export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  ogImage?: string;
  locale?: string;
  twitterHandle?: string;
  author?: { name: string; url?: string };
  links?: { twitter?: string; github?: string };
};

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
