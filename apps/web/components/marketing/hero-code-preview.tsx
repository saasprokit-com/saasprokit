import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CodePreview,
  type CodePreviewTab,
} from "@repo/design-system/components/blocks/code-preview/code-preview";
import {
  highlightCode,
  type SupportedLang,
} from "@repo/design-system/lib/shiki-theme";

const MONOREPO_ROOT = join(process.cwd(), "..", "..");
const TRAILING_WHITESPACE = /\s+$/u;

interface SnippetSpec {
  id: string;
  label: string;
  lang: SupportedLang;
  path: string;
  lineRange?: readonly [number, number];
}

const SNIPPETS: readonly SnippetSpec[] = [
  {
    id: "schema.prisma",
    label: "schema.prisma",
    lang: "prisma",
    path: "packages/database/prisma/schema.prisma",
    lineRange: [11, 139],
  },
  {
    id: "auth.ts",
    label: "auth.ts",
    lang: "typescript",
    path: "apps/web/lib/auth/auth.ts",
  },
  {
    id: "layout.tsx",
    label: "(app)/layout.tsx",
    lang: "tsx",
    path: "apps/web/app/[locale]/(app)/layout.tsx",
  },
];

function readSlice(
  path: string,
  lineRange?: readonly [number, number]
): string {
  const full = readFileSync(join(MONOREPO_ROOT, path), "utf8");
  if (!lineRange) {
    return full.replace(TRAILING_WHITESPACE, "");
  }
  const [start, end] = lineRange;
  return full
    .split("\n")
    .slice(start - 1, end)
    .join("\n");
}

export async function HeroCodePreview({ className }: { className?: string }) {
  const tabs: CodePreviewTab[] = await Promise.all(
    SNIPPETS.map(async (s) => ({
      id: s.id,
      label: s.label,
      html: await highlightCode(readSlice(s.path, s.lineRange), s.lang),
    }))
  );

  return (
    <CodePreview className={className} defaultTab="schema.prisma" tabs={tabs} />
  );
}
