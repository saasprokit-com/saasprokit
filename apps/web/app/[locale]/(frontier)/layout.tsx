import { Footer } from "@repo/design-system/components/blocks/footer/footer";
import { Header } from "@repo/design-system/components/molecules/header/header";
import Link from "next/link";
import type { ReactNode } from "react";
import { getServerSession } from "@/lib/auth/auth";
import { HeaderUserMenu } from "./components/header-user-menu";

interface RootLayoutProperties {
  readonly children: ReactNode;
}

const Frontier = async ({ children }: RootLayoutProperties) => {
  const session = await getServerSession();

  return (
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
          <span className="font-bold font-mono text-lg tracking-tight">
            SAAS
          </span>
        }
        right={<HeaderUserMenu user={session?.user} />}
      />

      <div className="flex flex-col">{children}</div>

      <Footer
        brand="SAAS"
        columns={[
          {
            title: "Products",
            links: [
              { label: "Features", href: "#features" },
              { label: "Stack", href: "#deps" },
              { label: "Pricing", href: "#pricing" },
              { label: "Changelog", href: "#" },
            ],
          },
          {
            title: "Docs",
            links: [
              { label: "Quickstart", href: "/docs" },
              { label: "Auth", href: "/docs" },
              { label: "Billing", href: "/docs" },
              { label: "Email", href: "/docs" },
            ],
          },
          {
            title: "Resources",
            links: [
              { label: "Blog", href: "#" },
              { label: "Templates", href: "#" },
              { label: "Discord", href: "#" },
              { label: "Github", href: "#" },
            ],
          },
          {
            title: "Legal",
            links: [
              { label: "License", href: "#" },
              { label: "Privacy", href: "#" },
              { label: "Terms", href: "#" },
              { label: "Security", href: "#" },
            ],
          },
        ]}
        copyright={`© ${new Date().getFullYear()} SAAS Labs · MIT`}
        taglines={["/* a SaaS boilerplate */", "/* for people who ship */"]}
      />
    </main>
  );
};

export default Frontier;
