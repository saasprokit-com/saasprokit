import { Skeleton } from "@repo/design-system/components/ui/skeleton";

const headerKeys = ["h0", "h1", "h2", "h3", "h4", "h5"] as const;
const rowKeys = [
  "r0",
  "r1",
  "r2",
  "r3",
  "r4",
  "r5",
  "r6",
  "r7",
  "r8",
  "r9",
] as const;
const colKeys = ["c0", "c1", "c2", "c3", "c4", "c5"] as const;

export function MembersTableSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-8 w-[80px]" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-md border">
        <div className="divide-y">
          {/* Header */}
          <div className="flex items-center gap-4 bg-muted/50 px-4 py-3">
            {headerKeys.map((key) => (
              <Skeleton className="h-4 flex-1" key={key} />
            ))}
          </div>
          {/* Rows */}
          {rowKeys.map((rowKey) => (
            <div className="flex items-center gap-4 px-4 py-3" key={rowKey}>
              {colKeys.map((colKey) => (
                <Skeleton className="h-4 flex-1" key={`${rowKey}-${colKey}`} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination skeleton */}
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
