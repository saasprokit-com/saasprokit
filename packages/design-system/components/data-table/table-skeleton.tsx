import { Skeleton } from "@repo/design-system/components/ui/skeleton";

export function TableSkeleton({ totalRow = 8, totalCol = 5 }) {
  const colKeys = Array.from({ length: totalCol }, (_, c) => `c${c}`);
  const rowKeys = Array.from({ length: totalRow }, (_, r) => `r${r}`);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-[120px]" />
          <Skeleton className="h-8 w-[80px]" />
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <div className="divide-y">
          <div className="flex items-center gap-4 bg-muted/50 px-4 py-3">
            {colKeys.map((key) => (
              <Skeleton className="h-4 flex-1" key={key} />
            ))}
          </div>
          {rowKeys.map((rowKey) => (
            <div className="flex items-center gap-4 px-4 py-3" key={rowKey}>
              {colKeys.map((colKey) => (
                <Skeleton className="h-4 flex-1" key={`${rowKey}-${colKey}`} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <Skeleton className="h-4 w-[180px]" />
        <div className="flex items-center gap-6">
          <Skeleton className="h-8 w-[150px]" />
          <Skeleton className="h-4 w-[100px]" />
          <div className="flex items-center gap-2">
            <Skeleton className="size-8" />
            <Skeleton className="size-8" />
            <Skeleton className="size-8" />
            <Skeleton className="size-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
