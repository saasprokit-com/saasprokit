import { cn } from "@repo/design-system/lib/utils";
import type { ReactNode } from "react";

interface LogoProps {
  className?: string;
  text?: string;
  icon?: ReactNode;
}

export const Logo = ({ className, text, icon }: LogoProps) => {
  if (!(icon || text)) {
    return null;
  }
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 border-primary font-bold text-2xl text-primary",
        className
      )}
    >
      {icon}
      {text}
    </div>
  );
};
