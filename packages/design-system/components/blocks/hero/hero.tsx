import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";

export interface HeroCtaProps {
  label: string;
  href: string;
}

export interface HeroBenefitProps {
  text: string;
  icon?: React.ReactNode;
}

export interface HeroProps {
  badge?: string;
  title: string;
  highlightedText?: string;
  subtitle: string;
  primaryCta?: HeroCtaProps;
  secondaryCta?: HeroCtaProps;
  benefits?: (string | HeroBenefitProps)[];
  showGradientBackground?: boolean;
  className?: string;
  id?: string;
}

export function Hero({
  badge,
  title,
  highlightedText,
  subtitle,
  primaryCta,
  secondaryCta,
  benefits = [],
  showGradientBackground = true,
  className,
  id,
}: HeroProps) {
  return (
    <section
      className={`relative overflow-hidden ${showGradientBackground ? "bg-gradient-to-b from-primary/5 via-background to-background" : ""} ${className ?? ""}`}
      id={id}
    >
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="text-center">
          {badge && (
            <Badge className="mb-4" variant="secondary">
              {badge}
            </Badge>
          )}
          <h1 className="mx-auto max-w-4xl font-bold text-4xl tracking-tight sm:text-5xl lg:text-6xl">
            {title}{" "}
            {highlightedText && (
              <span className="text-primary">{highlightedText}</span>
            )}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            {subtitle}
          </p>
          {(primaryCta || secondaryCta) && (
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {primaryCta && (
                <Button asChild size="lg">
                  <Link href={primaryCta.href}>
                    {primaryCta.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              {secondaryCta && (
                <Button asChild size="lg" variant="outline">
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              )}
            </div>
          )}
          {benefits.length > 0 && (
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              {benefits.map((benefit) => {
                const text =
                  typeof benefit === "string" ? benefit : benefit.text;
                const icon = typeof benefit === "string" ? null : benefit.icon;
                return (
                  <div
                    className="flex items-center gap-2 text-muted-foreground text-sm"
                    key={text}
                  >
                    {icon ?? (
                      <svg
                        className="h-4 w-4 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <title>Checkmark</title>
                        <path
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        />
                      </svg>
                    )}
                    {text}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* Background decoration */}
      {showGradientBackground && (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        </div>
      )}
    </section>
  );
}
