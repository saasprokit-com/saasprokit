import { cn } from "@repo/design-system/lib/utils";
import type { ReactNode } from "react";

/**
 * Page-level grid system inspired by vercel.com.
 *
 * Each GridSection renders:
 *   1. A CSS Grid container with responsive columns
 *   2. Decorative vertical guide lines (DOM elements with border-right)
 *      at each column boundary, aria-hidden
 *   3. Optional cross (+) markers at section boundaries
 *
 * Content is placed via children which become grid items.
 */

type GridColumns = 1 | 2 | 3 | 4 | 6 | 12;

type GridSectionProps = {
  /** Number of columns at lg breakpoint */
  columns?: GridColumns;
  /** Number of columns at sm breakpoint */
  smColumns?: GridColumns;
  /** Show decorative guide lines */
  guides?: boolean;
  /** Show a cross (+) marker at the top-left */
  cross?: boolean;
  /** Additional className */
  className?: string;
  /** Section content */
  children: ReactNode;
  /** HTML id for anchor links */
  id?: string;
};

const lgGridCols: Record<GridColumns, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  6: "lg:grid-cols-6",
  12: "lg:grid-cols-12",
};

const smGridCols: Record<GridColumns, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  6: "sm:grid-cols-6",
  12: "sm:grid-cols-12",
};

export function GridSection({
  columns = 3,
  smColumns = 1,
  guides = true,
  cross = false,
  className,
  children,
  id,
}: GridSectionProps) {
  return (
    <section
      className={cn("relative border-border border-t", className)}
      id={id}
    >
      <div className="mx-auto max-w-7xl">
        {/* Cross marker */}
        {cross && (
          <div
            aria-hidden="true"
            className="-translate-x-1/2 -translate-y-1/2 absolute top-0 left-0 z-10"
          >
            <div className="relative h-[21px] w-[21px]">
              <div className="absolute top-0 left-1/2 h-full w-px bg-border" />
              <div className="absolute top-1/2 left-0 h-px w-full bg-border" />
            </div>
          </div>
        )}

        {/* Grid container */}
        <div
          className={cn(
            "relative grid grid-cols-1",
            smGridCols[smColumns],
            lgGridCols[columns]
          )}
        >
          {/* Guide lines */}
          {guides && (
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-0 grid grid-cols-1",
                smGridCols[smColumns],
                lgGridCols[columns]
              )}
            >
              {Array.from({ length: columns }).map((_, i) => (
                <div
                  className={cn(
                    "h-full",
                    i < columns - 1 && "border-border/50 border-r"
                  )}
                  key={`guide-${i}`}
                />
              ))}
            </div>
          )}

          {/* Content */}
          {children}
        </div>
      </div>
    </section>
  );
}

/**
 * A content block within a GridSection.
 * Spans a number of grid columns.
 */
type GridBlockProps = {
  /** Number of columns to span at lg */
  span?: number;
  /** Number of columns to span at sm */
  smSpan?: number;
  /** Additional className */
  className?: string;
  /** Block content */
  children: ReactNode;
};

const lgSpanCols: Record<number, string> = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
  9: "lg:col-span-9",
  10: "lg:col-span-10",
  11: "lg:col-span-11",
  12: "lg:col-span-12",
};

const smSpanCols: Record<number, string> = {
  1: "sm:col-span-1",
  2: "sm:col-span-2",
  3: "sm:col-span-3",
  4: "sm:col-span-4",
};

export function GridBlock({
  span,
  smSpan,
  className,
  children,
}: GridBlockProps) {
  return (
    <div
      className={cn(
        "relative",
        span && lgSpanCols[span],
        smSpan && smSpanCols[smSpan],
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * A separator grid section with just guide lines and a cross marker.
 * Used between content sections to create visual breaks.
 */
type GridSeparatorProps = {
  /** Show cross at top-left or bottom-right */
  crossPosition?: "top-left" | "bottom-right";
  className?: string;
};

export function GridSeparator({
  crossPosition = "top-left",
  className,
}: GridSeparatorProps) {
  return (
    <div className={cn("relative border-border border-t", className)}>
      <div className="mx-auto max-w-7xl">
        {/* Cross marker */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute z-10",
            crossPosition === "top-left" &&
              "-translate-x-1/2 -translate-y-1/2 top-0 left-0",
            crossPosition === "bottom-right" &&
              "-translate-y-1/2 top-full right-0 translate-x-1/2"
          )}
        >
          <div className="relative h-[21px] w-[21px]">
            <div className="absolute top-0 left-1/2 h-full w-px bg-border" />
            <div className="absolute top-1/2 left-0 h-px w-full bg-border" />
          </div>
        </div>
      </div>
    </div>
  );
}
