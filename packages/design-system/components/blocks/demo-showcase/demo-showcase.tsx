import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "../../ui/card";

export interface DemoShowcaseItemProps {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
}

export interface DemoShowcaseCtaProps {
  label: string;
  href: string;
}

export interface DemoShowcaseProps {
  badge?: string;
  title: string;
  subtitle?: string;
  items: DemoShowcaseItemProps[];
  cta?: DemoShowcaseCtaProps;
  className?: string;
}

export function DemoShowcase({
  badge,
  title,
  subtitle,
  items,
  cta,
  className,
}: DemoShowcaseProps) {
  return (
    <section className={`border-y bg-muted/30 py-16 ${className ?? ""}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
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
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <Card key={item.label}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{item.value}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
        {cta && (
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link href={cta.href}>
                {cta.label}
                <svg
                  className="ml-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Arrow right</title>
                  <path
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
