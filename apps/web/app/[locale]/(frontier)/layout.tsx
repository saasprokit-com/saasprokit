import { Header } from "@repo/design-system/components/molecules/header/header";
import Link from "next/link";
import type { ReactNode } from "react";

interface RootLayoutProperties {
  readonly children: ReactNode;
}

const Frontier = ({ children }: RootLayoutProperties) => (
  <main>
    <Header
      left={
        <nav className="flex items-center gap-6">
          <Link
            className="text-muted-foreground text-sm transition-colors hover:text-foreground"
            href="/docs"
          >
            Docs
          </Link>
        </nav>
      }
      logo="SaaSProKit"
      logoHref="/"
      right={
        <Link
          className="text-muted-foreground text-sm transition-colors hover:text-foreground"
          href="https://github.com/saasprokit-com/saasprokit"
          rel="noopener noreferrer"
          target="_blank"
        >
          GitHub
        </Link>
      }
    />

    <div className="flex flex-col">{children}</div>
  </main>
);

export default Frontier;
