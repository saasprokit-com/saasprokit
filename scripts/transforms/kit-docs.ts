export const KIT_DOCS_FILTER = " --filter=!kit-docs";

export const KIT_DOCS_REFERENCES: { file: string; lines: string[] }[] = [
  { file: "pnpm-workspace.yaml", lines: ['- "docs"'] },
  { file: "docker/dev.Dockerfile", lines: ["COPY docs/"] },
  { file: "biome.jsonc", lines: ['"!docs/**/*.json"'] },
];

export function dropLines(text: string, needles: string[]): string {
  return text
    .split("\n")
    .filter((line) => !needles.some((needle) => line.includes(needle)))
    .join("\n");
}
