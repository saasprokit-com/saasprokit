import { Separator } from "@repo/design-system/components/ui/separator";
import { cn } from "@repo/design-system/lib/utils";
import type { ReactNode } from "react";

type ContentSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function ContentSection({
  title,
  description,
  children,
  action,
  className,
  contentClassName,
}: ContentSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="font-bold text-2xl tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>

      <Separator />

      <div className={cn("space-y-6", contentClassName)}>{children}</div>
    </div>
  );
}
