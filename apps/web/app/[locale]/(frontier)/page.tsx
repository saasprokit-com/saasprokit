import { CTABanner } from "@repo/design-system/components/blocks/cta-banner/cta-banner";
import { FeatureShowcase } from "@repo/design-system/components/blocks/feature-showcase/feature-showcase";
import { FeaturesGrid } from "@repo/design-system/components/blocks/features-grid/features-grid";
import { Hero } from "@repo/design-system/components/blocks/hero/hero";
import { Pricing } from "@repo/design-system/components/blocks/pricing/pricing";
import { getDictionary } from "@repo/internationalization";
import { getAllPlans, getMonthlyFromAnnual } from "@repo/payment/plans";
import {
  Boxes,
  Braces,
  Building2,
  CreditCard,
  Database,
  KeyRound,
  Languages,
  type LucideIcon,
  Rocket,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import type { Metadata } from "next";
import { siteConfig } from "@/lib/seo-config";
import { APP_VERSION } from "@/lib/version";

export const metadata: Metadata = {
  title: {
    absolute: `${siteConfig.name} - Production-Ready SaaS Boilerplate`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: siteConfig.url,
  },
};

const SAAS_PRO_KIT = "https://saasprokit.com";

// Icons map by index onto the localized feature/showcase copy in the dictionary.
// pickIcon fails loudly if a locale's array ever outgrows its icon list, instead of
// passing an undefined component to the block (which would crash at render).
const FEATURE_ICONS = [Rocket, Database, Workflow, Braces, Boxes, Languages];
const SHOWCASE_ICONS = [Building2, KeyRound, CreditCard, ShieldCheck];

function pickIcon(icons: readonly LucideIcon[], index: number, group: string) {
  const icon = icons[index];
  if (!icon) {
    throw new Error(
      `Missing icon for ${group}[${index}]: dictionary copy has more entries than the icon list.`
    );
  }
  return icon;
}

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const { web } = await getDictionary(locale);
  const home = web.home;
  const plans = getAllPlans();

  return (
    <div className="min-h-screen">
      <Hero
        badge={`${APP_VERSION} - ${home.hero.badgeSuffix}`}
        benefits={home.hero.benefits}
        highlightedText={home.hero.highlightedText}
        primaryCta={{ label: home.hero.primaryCta, href: SAAS_PRO_KIT }}
        secondaryCta={{ label: home.hero.secondaryCta, href: "/org" }}
        subtitle={home.hero.subtitle}
        title={home.hero.title}
      />

      <FeaturesGrid
        badge={home.featuresGrid.badge}
        columns={3}
        features={home.featuresGrid.features.map((feature, index) => ({
          icon: pickIcon(FEATURE_ICONS, index, "featuresGrid.features"),
          title: feature.title,
          description: feature.description,
        }))}
        subtitle={home.featuresGrid.subtitle}
        title={home.featuresGrid.title}
      />

      <FeatureShowcase
        items={home.showcase.items.map((item, index) => ({
          badge: item.badge,
          title: item.title,
          description: item.description,
          bullets: item.bullets,
          icon: pickIcon(SHOWCASE_ICONS, index, "showcase.items"),
        }))}
      />

      <Pricing
        id="pricing"
        subtitle={home.pricing.subtitle}
        tiers={plans.map((plan) => ({
          name: plan.displayName,
          description: plan.description,
          monthlyPrice: plan.monthlyPrice,
          annualPrice: getMonthlyFromAnnual(plan.yearlyPrice),
          features: plan.features,
          popular: plan.highlighted,
          cta:
            plan.monthlyPrice === 0
              ? home.pricing.ctaFree
              : home.pricing.ctaPaid,
          ctaHref: `/auth/sign-up${plan.name === "free" ? "" : `?plan=${plan.name}`}`,
        }))}
        title={home.pricing.title}
      />

      <CTABanner
        primaryCta={{ label: home.cta.primaryCta, href: SAAS_PRO_KIT }}
        subtitle={home.cta.subtitle}
        title={home.cta.title}
      />
    </div>
  );
}
