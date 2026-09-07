import { codeToHtml } from "shiki";

export type SupportedLang = "prisma" | "typescript" | "tsx" | "ts";

export function highlightCode(
  code: string,
  lang: SupportedLang
): Promise<string> {
  return codeToHtml(code, {
    lang,
    themes: { light: "light-plus", dark: "dark-plus" },
    defaultColor: "light",
  });
}
