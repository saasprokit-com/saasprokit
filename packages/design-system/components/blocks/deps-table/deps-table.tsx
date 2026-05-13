import { cn } from "@repo/design-system/lib/utils";

interface Dep {
  category: string;
  name: string;
  description: string;
}

const DEPS: [Dep, Dep][] = [
  [
    {
      category: "framework",
      name: "Next.js 16",
      description: "App Router, RSC, Server Actions",
    },
    {
      category: "ui",
      name: "React 19",
      description: "Suspense, transitions, use()",
    },
  ],
  [
    {
      category: "auth",
      name: "better-auth",
      description: "sessions, OAuth, 2FA, orgs",
    },
    {
      category: "database",
      name: "Prisma",
      description: "typed client, migrations",
    },
  ],
  [
    { category: "store", name: "Postgres", description: "Neon or your own" },
    { category: "billing", name: "Stripe", description: "subs, usage, portal" },
  ],
  [
    { category: "email", name: "Resend", description: "React Email + Resend" },
    {
      category: "styling",
      name: "Tailwind 4",
      description: "tokens, dark mode",
    },
  ],
  [
    { category: "tests", name: "Vitest", description: "unit + integration" },
    { category: "e2e", name: "Playwright", description: "auth, billing flows" },
  ],
  [
    { category: "monorepo", name: "Turborepo", description: "apps + packages" },
    {
      category: "components",
      name: "shadcn/ui",
      description: "accessible primitives",
    },
  ],
];

interface DepsTableProps {
  className?: string;
}

export function DepsTable({ className }: DepsTableProps) {
  return (
    <div className={cn("border border-border", className)}>
      {/* Header */}
      <div className="border-border border-b px-6 py-3 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.08em]">
        package.json
      </div>

      {/* Rows */}
      {DEPS.map((pair, i) => (
        <div className="grid grid-cols-1 md:grid-cols-2" key={`dep-row-${i}`}>
          {pair.map((dep) => (
            <div
              className="flex items-baseline gap-4 border-border border-b px-6 py-4 last:border-b-0 md:[&:nth-child(odd)]:border-r"
              key={dep.category}
            >
              <span className="w-20 shrink-0 font-mono text-muted-foreground text-xs">
                {dep.category}
              </span>
              <span className="font-medium font-mono text-sm">{dep.name}</span>
              <span className="ml-auto font-mono text-muted-foreground text-xs">
                {dep.description}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
