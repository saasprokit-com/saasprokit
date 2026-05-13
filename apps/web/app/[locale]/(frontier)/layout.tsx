import { Header } from "@repo/design-system/components/molecules/header/header";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface RootLayoutProperties {
  readonly children: ReactNode;
}

const Frontier = ({ children }: RootLayoutProperties) => (
  <main>
    <Header
      left={
        <nav className="hidden items-center gap-6 sm:flex">
          <Link
            className="font-mono text-muted-foreground text-xs transition-colors hover:text-foreground"
            href="/docs"
          >
            docs
          </Link>
          <Link
            className="font-mono text-muted-foreground text-xs transition-colors hover:text-foreground"
            href="#features"
          >
            features
          </Link>
          <Link
            className="font-mono text-muted-foreground text-xs transition-colors hover:text-foreground"
            href="#pricing"
          >
            pricing
          </Link>
        </nav>
      }
      logo={
        <span className="font-bold font-mono text-lg tracking-tight">SAAS</span>
      }
      right={
        <Link
          className="inline-flex items-center gap-1.5 bg-foreground px-3 py-1.5 font-mono text-background text-xs transition-opacity hover:opacity-90"
          href="#customize"
        >
          demo
          <ArrowRight className="h-3 w-3" />
        </Link>
      }
    />

    <div className="flex flex-col">{children}</div>
  </main>
);

export default Frontier;
