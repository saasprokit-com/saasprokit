import { getAllPlans } from "@repo/payment/plans";
import type { Metadata } from "next";
import { siteConfig } from "../../../lib/seo-config";
import { HomePageClient } from "./home-page-client";

export const metadata: Metadata = {
  title: {
    absolute: `${siteConfig.name} - Production-Ready SaaS Boilerplate`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: siteConfig.url,
  },
};

export default function HomePage() {
  const plans = getAllPlans();
  return <HomePageClient plans={plans} />;
}
