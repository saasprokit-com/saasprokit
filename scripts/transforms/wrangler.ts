import { parse, stringify } from "comment-json";

interface WranglerShape {
  env?: unknown;
  name?: string;
  r2_buckets?: { bucket_name?: string }[];
  services?: { service?: string }[];
}

export function customizeWrangler(jsonc: string, slug: string): string {
  const config = parse(jsonc) as WranglerShape & Record<string, unknown>;
  config.env = undefined;
  const rebranded = stringify(config, null, 2).replaceAll("saasprokit", slug);

  const branded = parse(rebranded) as WranglerShape & Record<string, unknown>;
  const previous = branded.name ?? "";
  if (previous === slug || previous.startsWith(`${slug}-`)) {
    return rebranded;
  }

  const renamed = `${slug}-${previous}`;
  branded.name = renamed;
  for (const service of branded.services ?? []) {
    if (service.service === previous) {
      service.service = renamed;
    }
  }
  for (const bucket of branded.r2_buckets ?? []) {
    if (bucket.bucket_name?.startsWith(previous)) {
      bucket.bucket_name = renamed + bucket.bucket_name.slice(previous.length);
    }
  }
  return stringify(branded, null, 2);
}
