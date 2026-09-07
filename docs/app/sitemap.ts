import type { MetadataRoute } from "next";
import { docsUrl } from "@/lib/site";
import { source } from "@/lib/source";

export default function sitemap(): MetadataRoute.Sitemap {
  return source.getPages().map((page) => ({ url: docsUrl(page.url) }));
}
