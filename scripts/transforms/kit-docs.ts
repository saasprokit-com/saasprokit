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

interface LaunchConfig {
  name?: string;
  [key: string]: unknown;
}

interface LaunchFile {
  configurations?: LaunchConfig[];
  version?: string;
  [key: string]: unknown;
}

export function stripKitDocsLaunchConfig(text: string): string {
  try {
    const parsed = JSON.parse(text) as LaunchFile;
    if (!Array.isArray(parsed.configurations)) {
      return text;
    }
    parsed.configurations = parsed.configurations.filter(
      (config) => !String(config.name ?? "").includes("kit-docs")
    );
    return `${JSON.stringify(parsed, null, 2)}\n`;
  } catch {
    return text;
  }
}
