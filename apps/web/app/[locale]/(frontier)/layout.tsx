import { Footer } from "@repo/design-system/components/molecules/footer/footer";
import { Header } from "@repo/design-system/components/molecules/header/header";
import { ModeToggle } from "@repo/design-system/components/molecules/header/mode-toggle";
import { Logo } from "@repo/design-system/components/molecules/logo/logo";
import { getDictionary } from "@repo/internationalization";
import { Github, Linkedin, Twitter, Youtube } from "lucide-react";
import type { ReactNode } from "react";
import { getServerSession } from "@/lib/auth/auth";
import { HeaderUserMenu } from "./components/header-user-menu";
import { LanguageToggle } from "./components/language-toggle";

interface RootLayoutProperties {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string }>;
}

const Frontier = async ({ children, params }: RootLayoutProperties) => {
  const { locale } = await params;
  const [session, { web }] = await Promise.all([
    getServerSession(),
    getDictionary(locale),
  ]);
  const { nav, footer } = web.home;

  return (
    <main>
      <Header
        className="fixed top-0 z-40 w-full border-none bg-transparent transition-shadow data-[scrolled=true]:bg-background/80 data-[scrolled=true]:shadow-sm data-[scrolled=true]:backdrop-blur"
        items={[
          { href: "/docs", label: nav.docs },
          { href: "#features", label: nav.features },
          { href: "#pricing", label: nav.pricing },
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
        description={footer.description}
        logo={<Logo text="LOGO" />}
        sections={[
          {
            title: footer.products.title,
            links: [
              { label: footer.products.features, href: "#features" },
              { label: footer.products.stack, href: "#deps" },
              { label: footer.products.pricing, href: "#pricing" },
              { label: footer.products.changelog, href: "#" },
            ],
          },
          {
            title: footer.docs.title,
            links: [
              { label: footer.docs.quickstart, href: "/docs" },
              { label: footer.docs.auth, href: "/docs" },
              { label: footer.docs.billing, href: "/docs" },
              { label: footer.docs.email, href: "/docs" },
            ],
          },
          {
            title: footer.resources.title,
            links: [
              { label: footer.resources.blog, href: "#" },
              { label: footer.resources.templates, href: "#" },
              { label: footer.resources.discord, href: "#" },
              { label: footer.resources.license, href: "#" },
            ],
          },
          {
            title: footer.legal.title,
            links: [
              { label: footer.legal.privacy, href: "#" },
              { label: footer.legal.terms, href: "#" },
              { label: footer.legal.security, href: "#" },
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
