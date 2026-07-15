import { Separator } from "@repo/design-system/components/ui/separator";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";

export interface PageSkeletonProps {
  rows?: number;
}

/**
 * Content-area skeleton shaped like <ContentSection>: heading + description,
 * a separator, then a stack of body blocks.
 */
export function PageSkeleton({ rows = 3 }: PageSkeletonProps) {
  const rowKeys = Array.from({ length: rows }, (_, i) => `row-${i}`);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>

      <Separator />

      <div className="space-y-6">
        {rowKeys.map((key) => (
          <Skeleton className="h-28 w-full rounded-lg" key={key} />
        ))}
      </div>
    </div>
  );
}
