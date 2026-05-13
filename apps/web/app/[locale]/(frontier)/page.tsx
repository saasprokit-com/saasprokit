import { ConfigureBuild } from "@repo/design-system/components/blocks/configure-build/configure-build";
import { CtaTerminal } from "@repo/design-system/components/blocks/cta-terminal/cta-terminal";
import { DepsTable } from "@repo/design-system/components/blocks/deps-table/deps-table";
import { FeaturesTerminal } from "@repo/design-system/components/blocks/features-terminal/features-terminal";
import { FooterTerminal } from "@repo/design-system/components/blocks/footer-terminal/footer-terminal";
import { HeroTerminal } from "@repo/design-system/components/blocks/hero-terminal/hero-terminal";
import { PricingTerminal } from "@repo/design-system/components/blocks/pricing/pricing-terminal";
import { SectionHeading } from "@repo/design-system/components/blocks/section-heading/section-heading";
import { TestimonialsSection } from "@repo/design-system/components/blocks/testimonials/testimonials";
import { getAllPlans } from "@repo/payment/plans";
import {
  CreditCard,
  FileCode2,
  Lock,
  Mail,
  Palette,
  Shield,
} from "lucide-react";
import type { Metadata } from "next";
import { HeroCodePreview } from "@/components/marketing/hero-code-preview";
import { APP_VERSION } from "@/lib/version";
import { siteConfig } from "../../../lib/seo-config";

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
      <HeroTerminal
        bullets={[
          "// MIT for your app code",
          "// private repo mirror",
          "// deploy anywhere",
        ]}
        codePreview={<HeroCodePreview className="flex-1 border-0" />}
        description="Full-stack SaaS boilerplate. Next.js · React · better-auth. Auth, billing, teams, email, jobs - every wire already run."
        headline="ship saas in a weekend"
        primaryCta={{ label: "clone & ship", href: "/auth/sign-up" }}
        secondaryCta={{ label: "source", href: "https://github.com" }}
        sublines={["_not a weekend", "\u00A0\u00A0of setup."]}
        version={APP_VERSION}
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

      {/* Dependencies */}
      <section className="border-border border-b px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionHeading>every dep, accounted for.</SectionHeading>
          <DepsTable />
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-border border-b px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionHeading>teams shipping with SAAS.</SectionHeading>
          <TestimonialsSection
            testimonials={[
              {
                quote:
                  "Shipped our MVP in four days. Auth, billing, and teams were already done — we just wrote the product.",
                author: "Alice Tran",
                role: "Founder, Ledgerloop",
                initials: "AT",
              },
              {
                quote:
                  "I had stopped starting side projects because setup was miserable. Now I start one every weekend.",
                author: "Marco Devlin",
                role: "Staff Eng, ex-Stripe",
                initials: "MD",
              },
              {
                quote:
                  "The auth and billing code is the first thing I read in any boilerplate. This one I actually trusted.",
                author: "Priya Raman",
                role: "CTO, Slatework",
                initials: "PR",
              },
            ]}
            title=""
          />
        </div>
      </section>

      <ConfigureBuild />

      <PricingTerminal
        heading="buy the source once."
        plans={plans.map((plan) => ({
          name: plan.name,
          description: plan.description,
          monthlyPrice: plan.monthlyPrice,
          features: plan.features,
          badge: plan.badge,
          href: `/auth/sign-up${plan.name === "free" ? "" : `?plan=${plan.name}`}`,
        }))}
      />

      <CtaTerminal
        headline="you — shipping by Sunday."
        subtitle="# fork the repo. ship by Sunday."
      />

      <FooterTerminal
        brand="SAAS"
        columns={[
          {
            title: "/product",
            links: [
              { label: "features", href: "#features" },
              { label: "stack", href: "#deps" },
              { label: "pricing", href: "#pricing" },
              { label: "changelog", href: "#" },
            ],
          },
          {
            title: "/docs",
            links: [
              { label: "quickstart", href: "/docs" },
              { label: "auth", href: "/docs" },
              { label: "billing", href: "/docs" },
              { label: "email", href: "/docs" },
            ],
          },
          {
            title: "/resources",
            links: [
              { label: "blog", href: "#" },
              { label: "templates", href: "#" },
              { label: "discord", href: "#" },
              { label: "github", href: "#" },
            ],
          },
          {
            title: "/legal",
            links: [
              { label: "license", href: "#" },
              { label: "privacy", href: "#" },
              { label: "terms", href: "#" },
              { label: "security", href: "#" },
            ],
          },
        ]}
        copyright={`© ${new Date().getFullYear()} SAAS Labs · MIT`}
        taglines={["/* a SaaS boilerplate */", "/* for people who ship */"]}
      />
    </div>
  );
}
