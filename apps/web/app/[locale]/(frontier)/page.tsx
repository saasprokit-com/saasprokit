import { ConfigureBuild } from "@repo/design-system/components/blocks/configure-build/configure-build";
import { Cta } from "@repo/design-system/components/blocks/cta/cta";
import { FeaturesTerminal } from "@repo/design-system/components/blocks/features-terminal/features-terminal";
import { Hero } from "@repo/design-system/components/blocks/hero/hero";
import { Pricing } from "@repo/design-system/components/blocks/pricing/pricing";
import { getAllPlans, getMonthlyFromAnnual } from "@repo/payment/plans";
import {
  CreditCard,
  FileCode2,
  Lock,
  Mail,
  Palette,
  Shield,
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

export default function HomePage() {
  const plans = getAllPlans();

  return (
    <div className="min-h-screen">
      <Hero
        badge={APP_VERSION}
        benefits={[
          "MIT for your app code",
          "private repo mirror",
          "deploy anywhere",
        ]}
        highlightedText="and your highlighted text here"
        primaryCta={{ label: "clone & ship", href: "/auth/sign-up" }}
        secondaryCta={{ label: "source", href: "https://github.com" }}
        subtitle="Full-stack SaaS boilerplate. Next.js · React · better-auth. Auth, billing, teams, email, jobs - every wire already run."
        title="Your title here "
      />

      <FeaturesTerminal
        features={[
          {
            num: "01",
            icon: Lock,
            title: "Auth, from day one",
            description:
              "better-auth with email/password, magic links, OAuth, 2FA, org & team tenancy, RBAC. No rolling your own.",
          },
          {
            num: "02",
            icon: CreditCard,
            title: "Billing wired up",
            description:
              "Stripe subscriptions, metered usage, customer portal, webhooks verified. Plans in one config file.",
          },
          {
            num: "03",
            icon: FileCode2,
            title: "Typed end to end",
            description:
              "Next.js App Router, Prisma ORM, Postgres, Server Actions. Types flow from schema to UI with zero glue.",
          },
          {
            num: "04",
            icon: Mail,
            title: "Transactional mail",
            description:
              "React Email templates, Resend adapter, preview server. Swap provider without touching send sites.",
          },
          {
            num: "05",
            icon: Shield,
            title: "Admin dashboard",
            description:
              "User & org management, impersonation, plan overrides, audit log. Gate routes by role with a single check.",
          },
          {
            num: "06",
            icon: Palette,
            title: "UI that ships",
            description:
              "shadcn-style primitives, dark mode, keyboard nav, a11y audited. Drop in, rename, adjust tokens.",
          },
        ]}
        heading="the boring parts, already done."
      />

      <ConfigureBuild />

      <Pricing
        id="pricing"
        subtitle="One source, three tiers. Start free, upgrade when you outgrow it."
        tiers={plans.map((plan) => ({
          name: plan.displayName,
          description: plan.description,
          monthlyPrice: plan.monthlyPrice,
          annualPrice: getMonthlyFromAnnual(plan.yearlyPrice),
          features: plan.features,
          popular: plan.highlighted,
          cta: plan.monthlyPrice === 0 ? "Start free" : "Get started",
          ctaHref: `/auth/sign-up${plan.name === "free" ? "" : `?plan=${plan.name}`}`,
        }))}
        title="Your price here"
      />

      <Cta
        headline="Build your own today"
        pretext="with saasprokit"
        subtitle="in a week"
      />
    </div>
  );
}
