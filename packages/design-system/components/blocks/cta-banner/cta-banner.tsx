import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";

export interface CTABannerCtaProps {
  label: string;
  href: string;
}

export interface CTABannerProps {
  title: string;
  subtitle?: string;
  primaryCta?: CTABannerCtaProps;
  secondaryCta?: CTABannerCtaProps;
  className?: string;
}

export function CTABanner({
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  className,
}: CTABannerProps) {
  return (
    <section className={cn("py-24", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-linear-to-br from-primary/70 to-primary px-8 py-16 text-center text-primary-foreground sm:px-16">
          <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              {subtitle}
            </p>
          )}
          {(primaryCta || secondaryCta) && (
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {primaryCta && (
                <Button asChild size="lg" variant="secondary">
                  <Link href={primaryCta.href}>
                    {primaryCta.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              {secondaryCta && (
                <Button
                  asChild
                  className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                  size="lg"
                  variant="outline"
                >
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
