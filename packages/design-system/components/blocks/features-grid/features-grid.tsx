import type { LucideIcon } from "lucide-react";
import { Badge } from "../../ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import {
  FeaturesGridContainer,
  FeaturesGridHeader,
  FeaturesGridItem,
} from "./features-grid.motion";

export interface FeatureItemProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface FeaturesGridProps {
  badge?: string;
  title: string;
  subtitle?: string;
  features: FeatureItemProps[];
  columns?: 2 | 3 | 4;
  className?: string;
  id?: string;
}

export function FeaturesGrid({
  badge,
  title,
  subtitle,
  features,
  columns = 3,
  className,
  id,
}: FeaturesGridProps) {
  const gridCols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <section className={`py-24 ${className ?? ""}`} id={id}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FeaturesGridHeader>
          {badge && (
            <Badge className="mb-4" variant="outline">
              {badge}
            </Badge>
          )}
          <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              {subtitle}
            </p>
          )}
        </FeaturesGridHeader>
        <FeaturesGridContainer
          className={`mt-16 grid gap-6 ${gridCols[columns]}`}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <FeaturesGridItem key={feature.title}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </FeaturesGridItem>
            );
          })}
        </FeaturesGridContainer>
      </div>
    </section>
  );
}
