"use client";

import { StyleConfigurator } from "@repo/design-system/components/blocks/style-configurator/style-configurator";
import { useStyleConfig } from "@repo/design-system/components/blocks/style-configurator/use-style-config";
import { Footer } from "@repo/design-system/components/molecules/footer/footer";
import { Button } from "@repo/design-system/components/ui/button";
import {
  GridBlock,
  GridSection,
  GridSeparator,
} from "@repo/design-system/components/ui/grid";
import type { PlanConfig } from "@repo/utils/payment";
import {
  ArrowRight,
  Building2,
  Check,
  CreditCard,
  FileText,
  Globe,
  Lock,
  Mail,
  Palette,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

/* ── Data ── */

const features = [
  {
    icon: Building2,
    title: "Organization Management",
    description:
      "Multi-tenant architecture with organization switching, member invitations, and roles.",
  },
  {
    icon: Users,
    title: "User Management",
    description:
      "Complete user lifecycle with registration, profiles, and team management.",
  },
  {
    icon: CreditCard,
    title: "Payment Integration",
    description:
      "Stripe subscriptions, invoices, usage-based billing, and customer portal.",
  },
  {
    icon: Lock,
    title: "Authentication",
    description:
      "Email/password, OAuth providers, 2FA, magic links, and session management.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description:
      "Granular permissions with platform-level and organization-scoped roles.",
  },
  {
    icon: Mail,
    title: "Email System",
    description:
      "React Email templates with Resend, automated workflows, and delivery tracking.",
  },
  {
    icon: FileText,
    title: "File Storage",
    description:
      "File uploads with cloud storage, image optimization, and access permissions.",
  },
  {
    icon: Globe,
    title: "Internationalization",
    description:
      "Multi-language support with locale detection and content translation.",
  },
  {
    icon: Zap,
    title: "API & Webhooks",
    description:
      "RESTful API with rate limiting, API keys, and webhook integrations.",
  },
];

interface TechItem {
  name: string;
  description: string;
  icon: ReactNode;
}

const techStack: TechItem[] = [
  {
    name: "Next.js 16",
    description: "React framework",
    icon: (
      <svg
        aria-label="Next.js"
        fill="currentColor"
        role="img"
        viewBox="0 0 24 24"
      >
        <path d="M18.665 21.978A11.94 11.94 0 0 1 12 24C5.377 24 0 18.623 0 12S5.377 0 12 0s12 5.377 12 12c0 3.583-1.574 6.801-4.067 9.001L9.219 7.2H7.2v9.596h1.615V9.251l9.85 12.727ZM16.8 7.2h-1.6v9.6h1.6V7.2Z" />
      </svg>
    ),
  },
  {
    name: "Better Auth",
    description: "Authentication",
    icon: (
      <svg
        aria-label="Better Auth"
        fill="currentColor"
        role="img"
        viewBox="0 0 24 24"
      >
        <path d="M12 1a4 4 0 0 0-4 4v3h8V5a4 4 0 0 0-4-4ZM6 8V5a6 6 0 1 1 12 0v3h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1Zm6 5a2 2 0 0 0-1 3.732V19h2v-2.268A2 2 0 0 0 12 13Z" />
      </svg>
    ),
  },
  {
    name: "Prisma",
    description: "Database ORM",
    icon: (
      <svg
        aria-label="Prisma"
        fill="currentColor"
        role="img"
        viewBox="0 0 24 24"
      >
        <path d="M21.807 18.285L13.553.756a1.324 1.324 0 00-1.129-.754 1.31 1.31 0 00-1.206.626l-8.952 14.5a1.356 1.356 0 00.016 1.455l4.376 6.778a1.408 1.408 0 001.58.581l12.703-3.757c.389-.115.707-.39.873-.755s.164-.783-.007-1.145zm-1.848.752L9.18 22.224a.452.452 0 01-.575-.52l3.85-18.438c.072-.345.549-.4.699-.08l7.129 15.138a.453.453 0 01-.323.713z" />
      </svg>
    ),
  },
  {
    name: "PostgreSQL",
    description: "Database",
    icon: (
      <svg
        aria-label="PostgreSQL"
        fill="currentColor"
        role="img"
        viewBox="0 0 24 24"
      >
        <path d="M23.56 14.05c-.18-.5-.55-.86-1.06-1.03-.2-.07-.4-.1-.61-.1-.52 0-1.06.24-1.56.64-.01-.64-.05-1.27-.13-1.87-.22-1.68-.72-3.05-1.47-4.05a7.87 7.87 0 00-2.4-2.17c.16-.39.24-.88.22-1.48a4.5 4.5 0 00-.56-2.02.68.68 0 00-.5-.35c-.04 0-.44-.05-1.13.2a7.03 7.03 0 00-1.72 1.01A8.4 8.4 0 0012 2.67c-.7-.04-1.36.01-1.98.14C9.18 2.03 8.43 1.53 7.9 1.3c-.6-.26-1-.24-1.13-.23a.67.67 0 00-.5.34c-.31.53-.52 1.2-.57 1.92-.03.5.02.95.13 1.33-.49.35-.95.77-1.37 1.27C3.52 7.02 2.94 8.5 2.7 10.3c-.24 1.78-.15 3.44.12 4.76.14.67.34 1.24.58 1.7.28.53.62.9 1 1.11.3.16.62.22.93.18.3-.04.57-.15.81-.32.04.3.12.6.25.91.24.57.62 1.12 1.12 1.47.42.3.9.46 1.38.46h.2c.63-.05 1.19-.33 1.58-.76l.05-.06c.07.7.25 1.4.54 2.04.38.85.96 1.55 1.72 1.94.31.16.66.25 1.02.27h.1c.61 0 1.18-.26 1.62-.73.47-.5.76-1.2.87-2.04.04-.35.06-.75.05-1.18l.27.06h.05c.6 0 1.15-.26 1.62-.77.53-.58.97-1.42 1.24-2.45.35.34.77.56 1.2.63.07.01.15.02.22.02.37 0 .74-.14 1.06-.43.35-.31.64-.78.84-1.36.2-.6.3-1.27.28-1.92a3.03 3.03 0 00-.3-1.28z" />
      </svg>
    ),
  },
  {
    name: "Tailwind CSS",
    description: "Styling",
    icon: (
      <svg
        aria-label="Tailwind CSS"
        fill="#06B6D4"
        role="img"
        viewBox="0 0 24 24"
      >
        <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z" />
      </svg>
    ),
  },
  {
    name: "shadcn/ui",
    description: "Components",
    icon: (
      <svg
        aria-label="shadcn/ui"
        fill="none"
        role="img"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path d="M15 3l-6 18" />
        <path d="M18 6l-12 12" />
      </svg>
    ),
  },
  {
    name: "Stripe",
    description: "Payments",
    icon: (
      <svg aria-label="Stripe" fill="#635BFF" role="img" viewBox="0 0 24 24">
        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-7.076-2.19L3.376 21.8C5.263 22.965 8.33 24 11.048 24c2.671 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-5.925-7.305z" />
      </svg>
    ),
  },
  {
    name: "Turborepo",
    description: "Build system",
    icon: (
      <svg aria-label="Turborepo" fill="#EF4444" role="img" viewBox="0 0 24 24">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3.6a8.4 8.4 0 110 16.8 8.4 8.4 0 010-16.8zm0 2.4a6 6 0 100 12 6 6 0 000-12zm0 2.4a3.6 3.6 0 110 7.2 3.6 3.6 0 010-7.2z" />
      </svg>
    ),
  },
];

const planCtas: Record<
  string,
  { label: string; href: string; variant: "default" | "outline" }[]
> = {
  free: [{ label: "Get Started", href: "/auth/sign-up", variant: "outline" }],
  pro: [
    {
      label: "Start Free Trial",
      href: "/auth/sign-up?plan=pro",
      variant: "default",
    },
  ],
  enterprise: [
    {
      label: "Contact Sales",
      href: "/auth/sign-up?plan=enterprise",
      variant: "default",
    },
    {
      label: "Request Trial",
      href: "/auth/sign-up?plan=enterprise",
      variant: "outline",
    },
  ],
};

/* ── Client Component ── */

interface HomePageClientProps {
  plans: PlanConfig[];
}

export function HomePageClient({ plans }: HomePageClientProps) {
  const [isDark, setIsDark] = useState(false);
  const { config, updateConfig, cssVars, reset } = useStyleConfig(isDark);
  const [showConfig, setShowConfig] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Watch for dark mode class changes on <html>
  useEffect(() => {
    const html = document.documentElement;
    const check = () => setIsDark(html.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Apply CSS variables directly to the DOM (React style prop doesn't handle custom properties reliably)
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    for (const [key, value] of Object.entries(cssVars)) {
      el.style.setProperty(key, value);
    }
  }, [cssVars]);

  return (
    <div ref={wrapperRef} className="min-h-screen">
      <main>
        {/* ── Hero ── */}
        <GridSection columns={3} cross>
          <GridBlock className="p-10" span={2}>
            <h1 className="max-w-xl font-semibold text-4xl tracking-tight sm:text-5xl lg:text-[48px]">
              The SaaS Boilerplate That{" "}
              <span className="text-primary">Ships Fast</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Production-ready foundation with auth, billing, organizations, and
              everything you need to launch your SaaS.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <Button asChild size="lg">
                <Link href="/docs">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link
                  href="https://github.com/saasprokit-com/saasprokit"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  View on GitHub
                </Link>
              </Button>
            </div>
          </GridBlock>
          <GridBlock className="border-border border-t p-10 lg:border-t-0">
            <p className="mb-6 font-medium text-muted-foreground text-xs uppercase tracking-wider">
              What you get
            </p>
            <ul className="space-y-4">
              {[
                "Production-ready code",
                "TypeScript end-to-end",
                "Monorepo architecture",
                "CI/CD configured",
              ].map((benefit) => (
                <li className="flex items-center gap-3 text-sm" key={benefit}>
                  <Check className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {benefit}
                </li>
              ))}
            </ul>
          </GridBlock>
        </GridSection>

        <GridSeparator />

        {/* ── Style Configurator ── */}
        <GridSection columns={3}>
          <GridBlock className="p-10" span={2}>
            <div className="flex items-center gap-3">
              <Palette className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-2xl">Make it yours</h2>
            </div>
            <p className="mt-3 max-w-lg text-muted-foreground text-sm">
              Every color, font, radius, and spacing in this boilerplate is
              configurable. Try it now... the entire page updates in realtime.
            </p>
            <button
              className="mt-4 text-primary text-sm underline underline-offset-4 lg:hidden"
              onClick={() => setShowConfig(!showConfig)}
              type="button"
            >
              {showConfig ? "Hide controls" : "Show controls"}
            </button>
          </GridBlock>
          <GridBlock
            className={`border-border border-t lg:border-t-0 ${showConfig ? "block" : "hidden lg:block"}`}
          >
            <StyleConfigurator
              config={config}
              onReset={reset}
              onUpdate={updateConfig}
            />
          </GridBlock>
        </GridSection>

        <GridSeparator />

        {/* ── Features ── */}
        <GridSection columns={3} smColumns={2}>
          {features.map((feature) => (
            <GridBlock
              className="flex flex-col justify-between border-border border-b p-8"
              key={feature.title}
            >
              <div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
              <div className="mt-6">
                <div className="flex h-10 w-10 items-center justify-center border border-border">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </GridBlock>
          ))}
        </GridSection>

        <GridSeparator />

        {/* ── Tech Stack ── */}
        <GridSection columns={4} smColumns={2}>
          {techStack.map((tech) => (
            <GridBlock
              className="flex flex-col items-center border-border border-b p-8 text-center"
              key={tech.name}
            >
              {tech.icon && (
                <div className="mb-3 flex h-10 w-10 items-center justify-center [&>svg]:h-6 [&>svg]:w-6">
                  {tech.icon}
                </div>
              )}
              <span className="font-medium text-sm">{tech.name}</span>
              <span className="mt-1 text-muted-foreground text-xs">
                {tech.description}
              </span>
            </GridBlock>
          ))}
        </GridSection>

        <GridSeparator />

        {/* ── Pricing ── */}
        <GridSection columns={3}>
          {plans.map((plan) => (
            <GridBlock
              className="relative flex flex-col border-border border-b p-10 lg:border-b-0"
              key={plan.name}
            >
              {plan.badge && (
                <div className="absolute top-0 right-0 left-0 flex justify-center">
                  <span className="-translate-y-1/2 bg-foreground px-4 py-1 font-medium text-background text-xs">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="font-bold text-2xl">{plan.displayName}</h3>
                <p className="mt-3 text-muted-foreground text-sm">
                  {plan.description}.
                  {plan.monthlyPrice > 0 ? (
                    <>
                      {" "}
                      <span className="font-semibold text-foreground">
                        ${plan.monthlyPrice}/mo
                      </span>
                    </>
                  ) : (
                    <>
                      {" "}
                      <span className="font-semibold text-foreground">
                        Free forever.
                      </span>
                    </>
                  )}
                </p>
              </div>

              <div className="mb-10 flex-1">
                {plan.name !== "free" && (
                  <p className="mb-4 text-muted-foreground text-xs">
                    All {plan.name === "enterprise" ? "Pro" : "Free"} features,
                    plus:
                  </p>
                )}
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      className="flex items-start gap-3 text-sm"
                      key={feature}
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center gap-3">
                {planCtas[plan.name]?.map((cta) => (
                  <Link
                    className={
                      cta.variant === "default"
                        ? "flex flex-1 items-center justify-between bg-foreground px-5 py-3 font-medium text-background text-sm transition-opacity hover:opacity-90"
                        : "flex flex-1 items-center justify-between border border-border px-5 py-3 font-medium text-sm transition-colors hover:bg-accent"
                    }
                    href={cta.href}
                    key={cta.label}
                  >
                    {cta.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </GridBlock>
          ))}
        </GridSection>

        <GridSeparator crossPosition="bottom-right" />
      </main>

      <Footer
        copyright={`© ${new Date().getFullYear()} SaaSProKit. All rights reserved.`}
        sections={[
          {
            title: "Product",
            links: [
              { label: "Documentation", href: "/docs" },
              { label: "Features", href: "#features" },
            ],
          },
          {
            title: "Resources",
            links: [
              {
                label: "GitHub",
                href: "https://github.com/saasprokit-com/saasprokit",
                external: true,
              },
              {
                label: "Storybook",
                href: "https://storybook.saasprokit.com",
                external: true,
              },
            ],
          },
        ]}
      />
    </div>
  );
}
