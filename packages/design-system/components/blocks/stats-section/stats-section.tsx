export type StatItemProps = {
  value: string;
  label: string;
  description: string;
};

export type StatsSectionProps = {
  stats: StatItemProps[];
  className?: string;
};

export function StatsSection({ stats, className }: StatsSectionProps) {
  return (
    <section className={`bg-muted/30 py-20 ${className ?? ""}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div className="text-center" key={stat.label}>
              <p className="font-bold text-4xl text-foreground tracking-tight">
                {stat.value}
              </p>
              <p className="mt-2 font-medium text-foreground text-sm">
                {stat.label}
              </p>
              <p className="mt-1 text-muted-foreground text-xs">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
