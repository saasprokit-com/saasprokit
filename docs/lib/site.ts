export const SITE_URL = "https://saasprokit.com";
export const DEMO_URL = "https://multi-tenant.saasprokit.com";
export const DOCS_PATH = "/docs";
export const DOCS_URL = `${SITE_URL}${DOCS_PATH}`;

export function docsUrl(pageUrl: string): string {
  return pageUrl === "/" ? DOCS_URL : `${DOCS_URL}${pageUrl}`;
}
