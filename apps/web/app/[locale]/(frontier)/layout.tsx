import { Header } from "@repo/design-system/components/molecules/header/header";
import type { ReactNode } from "react";

type RootLayoutProperties = {
  readonly children: ReactNode;
};

const Frontier = ({ children }: RootLayoutProperties) => (
  <main>
    <Header left={<div>Left</div>} logo="logo" logoHref="/" />

    <div className="flex flex-col">{children}</div>
  </main>
);

export default Frontier;
