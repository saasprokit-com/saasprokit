import { cn } from "@repo/design-system/lib/utils";

export type TestimonialProps = {
  quote: string;
  author: string;
  role: string;
  initials: string;
};

export type TestimonialsSectionProps = {
  title: string;
  testimonials: TestimonialProps[];
  className?: string;
};

export function TestimonialsSection({
  title,
  testimonials,
  className,
}: TestimonialsSectionProps) {
  return (
    <div className={cn("grid gap-6 md:grid-cols-3", className)}>
      {testimonials.map((testimonial) => (
        <div
          className="flex flex-col justify-between border border-border p-8"
          key={testimonial.author}
        >
          <div>
            <span className="mb-4 block font-mono text-2xl text-muted-foreground/30">
              &ldquo;
            </span>
            <p className="font-mono text-sm leading-relaxed">
              {testimonial.quote}
            </p>
          </div>
          <div className="mt-8 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted font-medium font-mono text-muted-foreground text-xs">
              {testimonial.initials}
            </div>
            <div>
              <p className="font-medium font-mono text-sm">
                {testimonial.author}
              </p>
              <p className="font-mono text-muted-foreground text-xs">
                {testimonial.role}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
