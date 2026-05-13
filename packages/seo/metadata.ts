import type { Metadata } from "next";
import { getSiteConfig } from "./config";

// Default metadata for the site
export const getDefaultMetadata = (): Metadata => {
  const config = getSiteConfig();

  return {
    metadataBase: new URL(config.url),
    title: {
      default: config.name,
      template: `%s | ${config.name}`,
    },
    description: config.description,
    keywords: [
      "blog",
      "technology",
      "development",
      "programming",
      "web development",
      "software engineering",
      "tutorials",
      "guides",
    ],
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
      title: config.name,
      description: config.description,
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
      title: config.name,
      description: config.description,
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
};
