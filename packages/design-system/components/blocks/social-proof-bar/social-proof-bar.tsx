export interface SocialProofItemProps {
  description: string;
  name: string;
}

export interface SocialProofBarProps {
  className?: string;
  items: SocialProofItemProps[];
  label: string;
}

export function SocialProofBar({
  label,
  items,
  className,
}: SocialProofBarProps) {
  return (
    <section
      className={`border-y bg-muted/30 py-12 ${className ?? ""}`}
      id="social-proof"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-8 text-center text-muted-foreground text-sm">
          {label}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {items.map((item) => (
            <div
              className="flex flex-col items-center text-center"
              key={item.name}
            >
              <span className="font-semibold text-foreground text-sm">
                {item.name}
              </span>
              <span className="text-muted-foreground text-xs">
                {item.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
