import { Card, Cards } from "fumadocs-ui/components/card";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { source } from "@/lib/source";

export default function HomePage() {
  const sections = source.pageTree.children.flatMap((node) => {
    if (node.type !== "folder") {
      return [];
    }
    const entry =
      node.index ?? node.children.find((child) => child.type === "page");
    if (!entry) {
      return [];
    }
    return [
      {
        description: node.description ?? entry.description,
        href: entry.url,
        icon: node.icon,
        title: node.name,
      },
    ];
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16 sm:py-24">
      <div className="text-center">
        <h1 className="mb-4 font-bold text-3xl tracking-tight">
          saasprokit documentation
        </h1>
        <p className="mx-auto max-w-xl text-fd-muted-foreground">
          Architecture and setup for the boilerplate — auth, billing, email, and
          deployment. This is not your product&apos;s docs; those live in{" "}
          <code>apps/docs</code>.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            className={buttonVariants({
              variant: "primary",
              className: "gap-1.5 px-4",
            })}
            href="https://multi-tenant.saasprokit.com"
            rel="noreferrer"
            target="_blank"
          >
            Live demo
            <ArrowUpRight className="size-4" />
          </a>
          <a
            className={buttonVariants({
              variant: "outline",
              className: "gap-1.5 px-4",
            })}
            href="https://saasprokit.com"
            rel="noreferrer"
            target="_blank"
          >
            saasprokit.com
            <ArrowUpRight className="size-4" />
          </a>
        </div>
      </div>
      <Cards className="mt-12 lg:grid-cols-3">
        {sections.map((section) => (
          <Card
            description={section.description}
            href={section.href}
            icon={section.icon}
            key={section.href}
            title={section.title}
          />
        ))}
      </Cards>
    </main>
  );
}
