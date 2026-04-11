import type { LucideIcon } from "lucide-react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "../../ui/badge";

export type FeatureShowcaseItemProps = {
  badge: string;
  title: string;
  description: string;
  bullets: string[];
  icon: LucideIcon;
};

export type FeatureShowcaseProps = {
  items: FeatureShowcaseItemProps[];
  className?: string;
};

export function FeatureShowcase({ items, className }: FeatureShowcaseProps) {
  return (
    <section className={`py-24 ${className ?? ""}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-24">
          {items.map((item, index) => {
            const isReversed = index % 2 !== 0;
            const Icon = item.icon;
            return (
              <div
                className={`flex flex-col items-center gap-12 lg:flex-row ${isReversed ? "lg:flex-row-reverse" : ""}`}
                key={item.title}
              >
                {/* Visual placeholder */}
                <div className="flex w-full items-center justify-center lg:w-1/2">
                  <div className="flex h-64 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent sm:h-80">
                    <Icon className="h-16 w-16 text-primary/40" />
                  </div>
                </div>

                {/* Text content */}
                <div className="w-full lg:w-1/2">
                  <Badge className="mb-4" variant="outline">
                    {item.badge}
                  </Badge>
                  <h2 className="font-bold text-2xl tracking-tight sm:text-3xl">
                    {item.title}
                  </h2>
                  <p className="mt-4 text-muted-foreground">
                    {item.description}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {item.bullets.map((bullet) => (
                      <li className="flex items-center gap-3" key={bullet}>
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                        <span className="text-muted-foreground text-sm">
                          {bullet}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
