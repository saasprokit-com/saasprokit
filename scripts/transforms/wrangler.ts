import { parse, stringify } from "comment-json";

export function customizeWrangler(jsonc: string, slug: string): string {
  const config = parse(jsonc) as Record<string, unknown> & {
    env?: unknown;
  };
  config.env = undefined;
  const structural = stringify(config, null, 2);
  return structural.replaceAll("saasprokit", slug);
}
