import merge from "lodash.merge";
import type { Metadata } from "next";

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

type MetadataGenerator = Omit<Metadata, "description" | "title"> & {
  title?: string;
  description: string;
  image?: string;
};

export const createMetadata = (
  { title, description, image, ...properties }: MetadataGenerator,
  config: SiteConfig
): Metadata => {
  const parsedTitle = title
    ? `${title} | ${config.name}`
    : { default: config.name, template: `%s | ${config.name}` };

  const defaultMetadata: Metadata = {
    metadataBase: new URL(config.url),
    title: parsedTitle,
    description,
    authors: config.author ? [config.author] : undefined,
    creator: config.name,
    publisher: config.name,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: "website",
      locale: config.locale || "en_US",
      url: config.url,
      siteName: config.name,
      title: title ?? config.name,
      description,
      images: config.ogImage
        ? [
            {
              url: config.ogImage,
              width: 1200,
              height: 630,
              alt: config.name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: title ?? config.name,
      description,
      images: config.ogImage ? [config.ogImage] : undefined,
      creator: config.twitterHandle,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: config.url,
    },
  };

  const metadata: Metadata = merge(defaultMetadata, properties);

  if (image && metadata.openGraph) {
    metadata.openGraph.images = [
      {
        url: image,
        width: 1200,
        height: 630,
        alt: title ?? config.name,
      },
    ];
  }

  return metadata;
};
