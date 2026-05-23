import { CTABanner } from "@repo/design-system/components/blocks/cta-banner/cta-banner";
import { FeatureShowcase } from "@repo/design-system/components/blocks/feature-showcase/feature-showcase";
import { FeaturesGrid } from "@repo/design-system/components/blocks/features-grid/features-grid";
import { Hero } from "@repo/design-system/components/blocks/hero/hero";
import { Pricing } from "@repo/design-system/components/blocks/pricing/pricing";
import { getAllPlans, getMonthlyFromAnnual } from "@repo/payment/plans";
import {
  Boxes,
  Braces,
  Building2,
  CreditCard,
  Database,
  KeyRound,
  Languages,
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

export default function HomePage() {
  const plans = getAllPlans();

  return (
    <div className="min-h-screen">
      <Hero
        badge={`${APP_VERSION} - ready for ship`}
        benefits={[
          "Auth & 2FA",
          "Stripe billing",
          "Teams & RBAC",
          "shadcn UI kit",
        ]}
        highlightedText=" in a week"
        primaryCta={{ label: "Clone & ship", href: SAAS_PRO_KIT }}
        secondaryCta={{ label: "Dashboard", href: "/org" }}
        subtitle="Full-stack SaaS boilerplate. Next.js · React · better-auth. Auth, billing, teams, email, jobs - every wire already run."
        title="Install custom ship"
      />

      <FeaturesGrid
        badge="The stack"
        columns={3}
        features={[
          {
            icon: Rocket,
            title: "Next.js 16 + App Router",
            description:
              "Server Components, Server Actions, async params, route groups. The new model, used the right way.",
          },
          {
            icon: Database,
            title: "Postgres + Prisma",
            description:
              "Schema-first models, typed client, migrations checked in. Neon-ready for serverless deploys.",
          },
          {
            icon: Workflow,
            title: "Turborepo + pnpm",
            description:
              "Tuned task graph with remote cache. Apps and packages share types across the whole monorepo.",
          },
          {
            icon: Braces,
            title: "TypeScript end-to-end",
            description:
              "Strict mode everywhere, Zod for boundaries, inferred types from Prisma to the form field.",
          },
          {
            icon: Boxes,
            title: "shadcn/ui + Tailwind v4",
            description:
              "Themeable primitives, dark mode, design tokens. Storybook included so designers can review live.",
          },
          {
            icon: Languages,
            title: "i18n + edge proxy",
            description:
              "Locale-prefixed routes, message catalogs, CSP nonces. Production middleware patterns, not toys.",
          },
        ]}
        subtitle="The pieces are picked, wired, and tested. Swap any of them, but you won't need to on day one."
        title="Built on what works"
      />

      <FeatureShowcase
        items={[
          {
            badge: "Multi-tenant",
            title: "Orgs and personal accounts",
            description:
              "Every user gets a personal workspace and can join any number of organizations. Billing, members, roles, and invites are scoped per-org — no leaks, no foot-guns.",
            bullets: [
              "Org-scoped subscriptions with one Stripe customer per org",
              "Owner / admin / member roles with route-level guards",
              "Invite flows with email confirmation and seat handling",
              "Slug-based URLs validated at the proxy layer",
            ],
            icon: Building2,
          },
          {
            badge: "Authentication",
            title: "Auth flows you'll ever need",
            description:
              "Better Auth handles cryptography, sessions, and account lifecycle. You just plug providers in. Email, magic links, OAuth, OTP, and 2FA — already tested end-to-end.",
            bullets: [
              "Email + password with verification and recovery flows",
              "Magic link sign-in and one-time code fallback",
              "Google and GitHub OAuth out of the box",
              "TOTP-based 2FA with backup codes and recovery",
            ],
            icon: KeyRound,
          },
          {
            badge: "Billing",
            title: "Stripe, wired the right way",
            description:
              "Subscriptions per organization, prorated upgrades, verified webhooks, customer portal for cards and invoices. Plans declared in one config, surfaced in pricing and checkout.",
            bullets: [
              "Per-org customer with subscription scoping and seat limits",
              "Self-serve portal for cards, invoices, and cancellation",
              "Idempotent webhook handling with replay-safe events",
              "Tiered plans (free / pro / enterprise) in one config file",
            ],
            icon: CreditCard,
          },
          {
            badge: "Hardened",
            title: "Production security from day one",
            description:
              "Edge protection, content security policy, rate limits, and audit trails. The hard parts of running a real product — already done, already tuned.",
            bullets: [
              "Per-request CSP nonces set by the edge proxy",
              "Rate-limited sign-in attempts to deter brute force",
              "Audit-ready session and account event tracking",
              "Strict TypeScript and Zod validation at every boundary",
            ],
            icon: ShieldCheck,
          },
        ]}
      />

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

      <CTABanner
        primaryCta={{ label: "Clone & ship", href: SAAS_PRO_KIT }}
        // secondaryCta={{ label: "View pricing", href: "#pricing" }}
        subtitle="Get the full kit and ship in a week, not a month."
        title="Ready to ship your product?"
      />
    </div>
  );
}
