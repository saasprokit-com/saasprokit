import { cn } from "@repo/design-system/lib/utils";
import type { ReactNode } from "react";
import { Stamp } from "../stamp/stamp";

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
    <Stamp>
      <div
        className={cn(
          "inline-flex items-center gap-2 font-bold text-2xl text-white",
          className
        )}
      >
        {icon}
        {text}
      </div>
    </Stamp>
  );
};
