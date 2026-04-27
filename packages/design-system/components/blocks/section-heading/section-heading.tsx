import type { ReactNode } from "react";

export function SectionHeading({
  children,
  subtitle,
  id,
}: {
  children: ReactNode;
  subtitle?: string;
  id?: string;
}) {
  return (
    <div className="mb-12 flex flex-wrap items-baseline gap-5 pb-5" id={id}>
      <h2 className="font-medium font-mono text-[clamp(28px,4vw,44px)] tracking-[-0.03em]">
        {children}
      </h2>
      {subtitle && (
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
          {subtitle}
        </span>
      )}
    </div>
  );
}
