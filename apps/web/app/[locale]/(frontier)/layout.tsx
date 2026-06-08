import { Footer } from "@repo/design-system/components/molecules/footer/footer";
import { Header } from "@repo/design-system/components/molecules/header/header";
import { ModeToggle } from "@repo/design-system/components/molecules/header/mode-toggle";
import { Logo } from "@repo/design-system/components/molecules/logo/logo";
import { Github, Linkedin, Twitter, Youtube } from "lucide-react";
import type { ReactNode } from "react";
import { getServerSession } from "@/lib/auth/auth";
import { HeaderUserMenu } from "./components/header-user-menu";
import { LanguageToggle } from "./components/language-toggle";

interface RootLayoutProperties {
  readonly children: ReactNode;
}

const Frontier = async ({ children }: RootLayoutProperties) => {
  const session = await getServerSession();

  return (
    <main>
      <Header
        className="fixed top-0 z-40 w-full border-none bg-transparent transition-shadow data-[scrolled=true]:bg-background/80 data-[scrolled=true]:shadow-sm data-[scrolled=true]:backdrop-blur"
        items={[
          { href: "/docs", label: "Docs" },
          { href: "#features", label: "Features" },
          { href: "#pricing", label: "Pricing" },
        ]}
        logo={<Logo text="LOGO" />}
        right={
          <>
            <LanguageToggle />
            <ModeToggle className="hidden md:inline-flex" />
            <HeaderUserMenu user={session?.user} />
          </>
        }
        transparent
      />

      <div className="flex flex-col">{children}</div>

      <Footer
        bottomRight={
          <>
            <LanguageToggle />
            <ModeToggle />
          </>
        }
        copyright={`© ${new Date().getFullYear()} SAAS Labs · MIT`}
        description="A SaaS boilerplate for people who ship."
        logo={<Logo text="LOGO" />}
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
          {
            title: "Legal",
            links: [
              { label: "Privacy", href: "#" },
              { label: "Terms", href: "#" },
              { label: "Security", href: "#" },
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
