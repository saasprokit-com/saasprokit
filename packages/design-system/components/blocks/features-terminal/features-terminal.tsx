import { SectionHeading } from "@repo/design-system/components/blocks/section-heading/section-heading";
import type { LucideIcon } from "lucide-react";

interface Feature {
  num: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

interface FeaturesTerminalProps {
  heading: string;
  features: Feature[];
}

export function FeaturesTerminal({ heading, features }: FeaturesTerminalProps) {
  return (
    <section
      className="border-border border-b px-6 py-20 sm:px-10"
      id="features"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading>{heading}</SectionHeading>

        <div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div className="flex flex-col bg-background p-8" key={feature.num}>
              <div className="mb-6 flex items-start justify-between">
                <span className="font-mono text-muted-foreground text-xs">
                  {feature.num}
                </span>
                <feature.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="font-medium font-mono text-base">
                {feature.title}
              </h3>
              <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
