import { Button } from "@repo/design-system/components/ui/button";
import { ArrowRight, Github } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface HeroTerminalProps {
  version: string;
  headline: string;
  sublines?: string[];
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  bullets?: string[];
  codePreview: ReactNode;
}

export function HeroTerminal({
  version,
  headline,
  sublines = [],
  description,
  primaryCta,
  secondaryCta,
  bullets = [],
  codePreview,
}: HeroTerminalProps) {
  return (
    <section className="border-border border-b">
      <div className="mx-auto grid min-h-[600px] grid-cols-1 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col justify-center border-border px-6 py-16 sm:px-10 lg:border-r lg:px-12">
          <div className="mb-6 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.15em]">
            {version} —{" "}
            <span className="text-[color:var(--code-string)]">● online</span>
          </div>

          <h1 className="font-medium font-mono text-[clamp(36px,5vw,64px)] leading-[1] tracking-[-0.04em]">
            {headline}
            {sublines.map((line) => (
              <span key={line}>
                <br />
                <span className="text-muted-foreground">{line}</span>
              </span>
            ))}
          </h1>

          <p className="mt-8 max-w-[420px] text-[15px] text-muted-foreground leading-relaxed">
            {description}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href={primaryCta.href}>
                {primaryCta.label}
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
            {secondaryCta && (
              <Button asChild variant="outline">
                <Link
                  href={secondaryCta.href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Github className="mr-2 h-3.5 w-3.5" />
                  {secondaryCta.label}
                </Link>
              </Button>
            )}
          </div>

          {bullets.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] text-muted-foreground">
              {bullets.map((b) => (
                <span key={b}>{b}</span>
              ))}
            </div>
          )}
        </div>

        <div className="lg:flex lg:items-stretch">{codePreview}</div>
      </div>
    </section>
  );
}
