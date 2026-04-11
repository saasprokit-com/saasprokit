import { Badge } from "../../ui/badge";

export type TechStackItemProps = {
  name: string;
  description: string;
};

export type TechStackProps = {
  badge?: string;
  title: string;
  subtitle?: string;
  technologies: TechStackItemProps[];
  className?: string;
};

export function TechStack({
  badge,
  title,
  subtitle,
  technologies,
  className,
}: TechStackProps) {
  return (
    <section className={`border-t bg-muted/30 py-24 ${className ?? ""}`}>
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
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {technologies.map((tech) => (
            <div
              className="flex flex-col items-center rounded-lg border bg-background p-4 text-center"
              key={tech.name}
            >
              <span className="font-medium text-sm">{tech.name}</span>
              <span className="text-muted-foreground text-xs">
                {tech.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
