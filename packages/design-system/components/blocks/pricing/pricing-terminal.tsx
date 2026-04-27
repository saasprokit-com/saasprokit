import { SectionHeading } from "@repo/design-system/components/blocks/section-heading/section-heading";
import Link from "next/link";

interface PricingPlan {
  name: string;
  displayName?: string;
  description: string;
  monthlyPrice: number;
  features: string[];
  badge?: string;
  href: string;
}

interface PricingTerminalProps {
  heading: string;
  plans: PricingPlan[];
}

export function PricingTerminal({ heading, plans }: PricingTerminalProps) {
  return (
    <section
      className="border-border border-b px-6 py-20 sm:px-10"
      id="pricing"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading>{heading}</SectionHeading>

        <div className="grid grid-cols-1 gap-0 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              className="relative flex flex-col border border-border p-10"
              key={plan.name}
            >
              {plan.badge && (
                <div className="absolute top-4 right-4">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.1em]">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-2 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.08em]">
                plan · {plan.name}
              </div>

              <div className="mb-2">
                <span className="font-medium font-mono text-4xl">
                  {plan.monthlyPrice > 0 ? `$${plan.monthlyPrice}` : "Free"}
                </span>
                {plan.monthlyPrice > 0 && (
                  <span className="ml-1 font-mono text-muted-foreground text-sm">
                    /mo
                  </span>
                )}
              </div>

              <p className="mb-8 font-mono text-muted-foreground text-xs">
                {"// "}
                {plan.description}
              </p>

              <ul className="mb-10 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li className="flex items-start gap-2 text-sm" key={feature}>
                    <span className="text-muted-foreground">+</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                className={
                  plan.name === "free"
                    ? "flex items-center justify-center border border-border py-3 font-mono text-xs transition-colors hover:bg-accent"
                    : "flex items-center justify-center bg-foreground py-3 font-mono text-background text-xs transition-opacity hover:opacity-90"
                }
                href={plan.href}
              >
                $ buy --{plan.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
