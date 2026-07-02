import type { LucideIcon } from "lucide-react";
import type { ReactElement } from "react";
import { Badge } from "../../ui/badge";
import { FeatureShowcaseMotionItem } from "./feature-showcase.motion";

export interface FeatureShowcaseItemProps {
  badge: string;
  bullets: string[];
  description: string;
  icon: LucideIcon;
  title: string;
}

export interface FeatureShowcaseProps {
  className?: string;
  items: FeatureShowcaseItemProps[];
}

export function FeatureShowcase({
  items,
  className,
}: FeatureShowcaseProps): ReactElement {
  return (
    <section className={`py-24 ${className ?? ""}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-24">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <FeatureShowcaseMotionItem
                badge={<Badge variant="outline">{item.badge}</Badge>}
                bullets={item.bullets}
                description={item.description}
                isReversed={index % 2 !== 0}
                key={item.title}
                title={item.title}
                visual={
                  <div className="flex h-64 w-full items-center justify-center rounded-2xl bg-linear-to-br from-primary/10 via-primary/5 to-transparent sm:h-80">
                    <Icon className="h-16 w-16 text-primary/40" />
                  </div>
                }
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
