"use client";

import { MONTHS_PER_YEAR } from "@repo/utils/date";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Switch } from "../../ui/switch";

export type PricingTierProps = {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  variant?: "default" | "outline";
  popular?: boolean;
};

export type PricingProps = {
  badge?: string;
  title: string;
  subtitle?: string;
  tiers: PricingTierProps[];
  showBillingToggle?: boolean;
  className?: string;
  id?: string;
};

export function Pricing({
  badge,
  title,
  subtitle,
  tiers,
  showBillingToggle = true,
  className,
  id,
}: PricingProps) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "monthly"
  );

  const formatPrice = (price: number) => {
    if (price === 0) {
      return "Free";
    }
    return `$${price}`;
  };

  return (
    <section className={`py-24 ${className ?? ""}`} id={id}>
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
          {showBillingToggle && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <span
                className={`text-sm ${billingPeriod === "monthly" ? "font-semibold text-foreground" : "text-muted-foreground"}`}
              >
                Monthly
              </span>
              <Switch
                checked={billingPeriod === "annual"}
                onCheckedChange={(checked) =>
                  setBillingPeriod(checked ? "annual" : "monthly")
                }
              />
              <span
                className={`flex items-center gap-2 text-sm ${billingPeriod === "annual" ? "font-semibold text-foreground" : "text-muted-foreground"}`}
              >
                Annual
                <Badge variant="secondary">Save ~17%</Badge>
              </span>
            </div>
          )}
        </div>
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {tiers.map((tier) => {
            const price =
              billingPeriod === "monthly"
                ? tier.monthlyPrice
                : tier.annualPrice;
            return (
              <Card
                className={`relative flex flex-col ${tier.popular ? "shadow-lg ring-2 ring-primary" : ""}`}
                key={tier.name}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="mt-4">
                    <span className="font-bold text-4xl">
                      {formatPrice(price)}
                    </span>
                    {price > 0 && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                    {billingPeriod === "annual" && price > 0 && (
                      <p className="mt-1 text-muted-foreground text-sm">
                        Billed annually (${(price * MONTHS_PER_YEAR).toFixed(0)}
                        /year)
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li className="flex items-start gap-3" key={feature}>
                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                        <span className="text-muted-foreground text-sm">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    asChild
                    className="w-full"
                    variant={
                      tier.variant ?? (tier.popular ? "default" : "outline")
                    }
                  >
                    <Link href={tier.ctaHref}>{tier.cta}</Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
