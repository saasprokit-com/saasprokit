import { parse, stringify } from "comment-json";

// comment-json keeps comments attached to surviving keys, so structural
// edits go through it; the final replace covers brand mentions inside
// comment text, which no JSON-level edit can reach.
export function customizeWrangler(jsonc: string, slug: string): string {
  const config = parse(jsonc) as Record<string, unknown> & {
    env?: unknown;
  };
  config.env = undefined;
  const structural = stringify(config, null, 2);
  return structural.replaceAll("saasprokit", slug);
}
