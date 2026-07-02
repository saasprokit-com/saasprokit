import type { ReactNode } from "react";
import { Stamp } from "../stamp/stamp";

interface LogoProps {
  className?: string;
  icon?: ReactNode;
  text?: string;
}

export const Logo = ({ className, text, icon }: LogoProps) => {
  if (!(icon || text)) {
    return null;
  }
  return (
    <Stamp className={className}>
      <span className="inline-flex items-center gap-2 font-bold text-2xl">
        {icon}
        {text}
      </span>
    </Stamp>
  );
};
