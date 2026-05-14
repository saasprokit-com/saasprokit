interface CtaProps {
  pretext?: string;
  headline: string;
  subtitle?: string;
}

export function Cta({ pretext, headline, subtitle }: CtaProps) {
  return (
    <section className="relative isolate overflow-hidden px-6 py-24 sm:px-10">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative mx-auto max-w-7xl text-center">
        <div className="mb-4 font-mono text-background/50 text-xs">
          {pretext}
        </div>
        <h2 className="mx-auto max-w-4xl font-bold text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          {headline}
        </h2>
        {subtitle && (
          <p className="mt-4 font-stretch-normal text-2xl text-background">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
