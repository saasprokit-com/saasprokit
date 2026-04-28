import type { ReactNode } from "react";

interface MainProps {
  children: ReactNode;
}

export function Main({ children }: MainProps) {
  return <main className="flex flex-1 flex-col gap-4 p-4">{children}</main>;
}
