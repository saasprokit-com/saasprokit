import { Badge } from "../../ui/badge";
import { Card, CardContent } from "../../ui/card";

export type TestimonialProps = {
  quote: string;
  author: string;
  role: string;
  initials: string;
};

export type TestimonialsSectionProps = {
  badge?: string;
  title: string;
  subtitle?: string;
  testimonials: TestimonialProps[];
  className?: string;
};

export function TestimonialsSection({
  badge,
  title,
  subtitle,
  testimonials,
  className,
}: TestimonialsSectionProps) {
  return (
    <section className={`py-24 ${className ?? ""}`} id="testimonials">
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
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card
              className="transition-shadow hover:shadow-md"
              key={testimonial.author}
            >
              <CardContent className="pt-6">
                <p className="text-muted-foreground italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-sm">
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {testimonial.author}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
