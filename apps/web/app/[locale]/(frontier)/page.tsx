import { CTABanner } from "@repo/design-system/components/blocks/cta-banner/cta-banner";
import { DemoShowcase } from "@repo/design-system/components/blocks/demo-showcase/demo-showcase";
import { FeaturesGrid } from "@repo/design-system/components/blocks/features-grid/features-grid";
import { Hero } from "@repo/design-system/components/blocks/hero/hero";
import { Pricing } from "@repo/design-system/components/blocks/pricing/pricing";
import { TechStack } from "@repo/design-system/components/blocks/tech-stack/tech-stack";
import { Footer } from "@repo/design-system/components/molecules/footer/footer";
import { getAllPlans } from "@repo/payment/plans";
import { MONTHS_PER_YEAR } from "@repo/utils/date";
import {
  Building2,
  CreditCard,
  FileText,
  Globe,
  Lock,
  Mail,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import { siteConfig } from "../../../lib/seo-config";

export const metadata: Metadata = {
  title: {
    absolute: `${siteConfig.name} - Production-Ready SaaS Boilerplate`,
  },
  description:
    "Ship your SaaS faster with our production-ready boilerplate. Built with Next.js, Better Auth, and all the features you need to launch.",
  alternates: {
    canonical: siteConfig.url,
  },
};

const features = [
  {
    icon: Building2,
    title: "Organization Management",
    description:
      "Multi-tenant architecture with organization switching, member invitations, and role-based access.",
  },
  {
    icon: Users,
    title: "User Management",
    description:
      "Complete user lifecycle: registration, profiles, team management, and activity tracking.",
  },
  {
    icon: CreditCard,
    title: "Payment Integration",
    description:
      "Stripe integration with subscriptions, invoices, usage-based billing, and customer portal.",
  },
  {
    icon: Lock,
    title: "Authentication",
    description:
      "Secure auth with email/password, OAuth providers, 2FA, magic links, and session management.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description:
      "Granular permissions with roles, policies, and organization-level access control.",
  },
  {
    icon: Mail,
    title: "Email System",
    description:
      "Transactional emails with React Email templates, automated workflows, and delivery tracking.",
  },
  {
    icon: FileText,
    title: "File Storage",
    description:
      "File uploads with cloud storage integration, image optimization, and access permissions.",
  },
  {
    icon: Globe,
    title: "Internationalization",
    description:
      "Multi-language support with i18n, locale detection, and content translation.",
  },
  {
    icon: Zap,
    title: "API & Webhooks",
    description:
      "RESTful API with OpenAPI docs, rate limiting, API keys, and webhook integrations.",
  },
];

const demoItems = [
  {
    icon: Users,
    label: "Users",
    value: "Auth",
    description: "Sign up, login, OAuth",
  },
  {
    icon: Building2,
    label: "Organizations",
    value: "Multi-tenant",
    description: "Teams & workspaces",
  },
  {
    icon: Shield,
    label: "Permissions",
    value: "RBAC",
    description: "Roles & access",
  },
  {
    icon: CreditCard,
    label: "Billing",
    value: "Stripe",
    description: "Subscriptions",
  },
];

const PERCENTAGE_MULTIPLIER = 100;

const PRICING_CTA: Record<
  string,
  { cta: string; ctaHref: string; variant?: "outline"; popular?: boolean }
> = {
  free: { cta: "Get Started", ctaHref: "/auth/sign-up", variant: "outline" },
  pro: {
    cta: "Upgrade to Pro",
    ctaHref: "/auth/sign-up?plan=pro",
    popular: true,
  },
  enterprise: {
    cta: "Contact Sales",
    ctaHref: "/auth/sign-up?plan=enterprise",
    variant: "outline",
  },
};

const pricingTiers = getAllPlans().map((plan) => ({
  name: plan.displayName,
  monthlyPrice: plan.monthlyPrice,
  annualPrice:
    plan.yearlyPrice > 0
      ? Math.round(
          (plan.yearlyPrice / MONTHS_PER_YEAR) * PERCENTAGE_MULTIPLIER
        ) / PERCENTAGE_MULTIPLIER
      : 0,
  description: plan.description,
  features: plan.features,
  ...PRICING_CTA[plan.name],
}));

const techStack = [
  { name: "Next.js 16", description: "React framework" },
  { name: "Better Auth", description: "Authentication" },
  { name: "Prisma", description: "Database ORM" },
  { name: "PostgreSQL", description: "Database" },
  { name: "Tailwind CSS", description: "Styling" },
  { name: "shadcn/ui", description: "Components" },
  { name: "Stripe", description: "Payments" },
];

const benefits = [
  "Production-ready code",
  "TypeScript end-to-end",
  "Monorepo architecture",
  "CI/CD configured",
  "Testing setup",
  "Documentation included",
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <main>
        <Hero
          badge="Ready to Ship"
          benefits={benefits}
          highlightedText="Ships Fast"
          primaryCta={{ label: "Get Started Free", href: "/auth/sign-up" }}
          secondaryCta={{ label: "View Demo", href: "/auth/sign-up" }}
          subtitle="Stop building the same features from scratch. Start with a production-ready foundation and focus on what makes your product unique."
          title="The SaaS Boilerplate That"
        />

        <DemoShowcase
          badge="Live Demo"
          cta={{ label: "Explore Dashboard", href: "/auth/sign-up" }}
          items={demoItems}
          subtitle="Explore a fully functional demo with all the foundational features. Experience authentication, organization management, and more."
          title="See It In Action"
        />

        <FeaturesGrid
          badge="Features"
          features={features}
          subtitle="A comprehensive set of features that every SaaS needs, built with best practices and ready for production."
          title="Everything You Need to Ship"
        />

        <Pricing
          badge="Pricing"
          showBillingToggle
          subtitle="Choose the plan that fits your needs. Cancel anytime."
          tiers={pricingTiers}
          title="Simple, Transparent Pricing"
        />

        <TechStack
          badge="Tech Stack"
          subtitle="Carefully selected technologies that work seamlessly together for the best developer experience."
          technologies={techStack}
          title="Built with Modern Technologies"
        />

        <CTABanner
          primaryCta={{ label: "Start Building Now", href: "/auth/sign-up" }}
          secondaryCta={{ label: "View Demo", href: "/auth/sign-up" }}
          subtitle="Get started today and ship your product faster. No more building authentication, payments, or user management from scratch."
          title="Ready to Build Your SaaS?"
        />
      </main>

      <Footer />
    </div>
  );
}
