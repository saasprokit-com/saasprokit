import { Footer } from "@repo/design-system/components/molecules/footer/footer";
import { Header } from "@repo/design-system/components/molecules/header/header";
import { Github, Linkedin, Twitter, Youtube } from "lucide-react";
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
        className="absolute w-full border-none bg-none"
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
            LOGO
          </span>
        }
        right={<HeaderUserMenu user={session?.user} />}
        sticky
        transparent
      />

      <div className="flex flex-col">{children}</div>

      <Footer
        bottomLinks={[
          { label: "Privacy", href: "#" },
          { label: "Terms", href: "#" },
          { label: "Security", href: "#" },
        ]}
        copyright={`© ${new Date().getFullYear()} SAAS Labs · MIT`}
        description="A SaaS boilerplate for people who ship."
        logo={
          <span className="font-bold font-mono text-lg tracking-tight">
            SAAS
          </span>
        }
        sections={[
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
              { label: "License", href: "#" },
            ],
          },
        ]}
        socialLinks={[
          {
            label: "GitHub",
            href: "https://github.com",
            icon: <Github size={20} />,
          },
          {
            label: "Twitter",
            href: "https://twitter.com",
            icon: <Twitter size={20} />,
          },
          {
            label: "LinkedIn",
            href: "https://linkedin.com",
            icon: <Linkedin size={20} />,
          },
          {
            label: "YouTube",
            href: "https://youtube.com",
            icon: <Youtube size={20} />,
          },
        ]}
      />
    </main>
  );
};

export default Frontier;
