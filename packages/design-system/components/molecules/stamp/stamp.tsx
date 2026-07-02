import { cn } from "@repo/design-system/lib/utils";
import type { CSSProperties, ReactNode } from "react";

interface StampProps {
  bracketSize?: string;
  bracketWidth?: string;
  children?: ReactNode;
  className?: string;
  color?: string;
}

export const Stamp = ({
  children,
  color = "var(--primary)",
  bracketSize = "0.3lh",
  bracketWidth = "2px",
  className,
}: StampProps) => {
  return (
    <div
      className={cn(
        "inline-grid grid-cols-[var(--stamp-bracket-size)_1fr_var(--stamp-bracket-size)] grid-rows-[var(--stamp-bracket-size)_1fr_var(--stamp-bracket-size)] align-middle",
        className
      )}
      style={
        {
          "--stamp-color": color,
          "--stamp-bracket-size": bracketSize,
          "--stamp-bracket-width": bracketWidth,
        } as CSSProperties
      }
    >
      <div className="border-t-(length:--stamp-bracket-width) border-s-(length:--stamp-bracket-width) border-(--stamp-color) [grid-area:1/1/2/2]" />
      <div className="border-t-(length:--stamp-bracket-width) border-e-(length:--stamp-bracket-width) border-(--stamp-color) [grid-area:1/3/2/4]" />
      <div className="border-b-(length:--stamp-bracket-width) border-s-(length:--stamp-bracket-width) border-(--stamp-color) [grid-area:3/1/4/2]" />
      <div className="border-b-(length:--stamp-bracket-width) border-e-(length:--stamp-bracket-width) border-(--stamp-color) [grid-area:3/3/4/4]" />
      <div className="m-[calc(var(--stamp-bracket-size)/2)] bg-(--stamp-color) px-1 font-semibold text-white [grid-area:1/1/4/4]">
        {children}
      </div>
    </div>
  );
};
