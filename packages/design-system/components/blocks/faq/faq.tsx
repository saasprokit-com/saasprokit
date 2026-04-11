"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../ui/accordion";
import { Badge } from "../../ui/badge";

export type FAQItemProps = {
  question: string;
  answer: string;
};

export type FAQSectionProps = {
  badge?: string;
  title: string;
  subtitle?: string;
  items: FAQItemProps[];
  className?: string;
};

export function FAQSection({
  badge,
  title,
  subtitle,
  items,
  className,
}: FAQSectionProps) {
  return (
    <section className={`py-24 ${className ?? ""}`} id="faq">
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
        <div className="mx-auto mt-16 max-w-3xl">
          <Accordion collapsible type="single">
            {items.map((item, index) => (
              <AccordionItem key={item.question} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-semibold">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
