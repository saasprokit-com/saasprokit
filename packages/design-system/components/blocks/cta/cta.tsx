interface CtaProps {
  pretext?: string;
  headline: string;
  subtitle?: string;
}

export function Cta({ pretext, headline, subtitle }: CtaProps) {
  return (
    <section className="bg-foreground px-6 py-24 text-background sm:px-10">
      <div className="mx-auto max-w-7xl text-center">
        <div className="mb-4 font-mono text-background/50 text-xs">
          {pretext}
        </div>
        <h2 className="font-medium font-mono text-[clamp(32px,6vw,72px)] tracking-[-0.04em]">
          {headline}
        </h2>
        {subtitle && (
          <p className="mt-4 font-mono text-background/60 text-sm">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
