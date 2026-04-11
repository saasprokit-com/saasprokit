import { z } from "zod";

export const MAX_SLUG_LENGTH = 50;
export const MIN_SLUG_LENGTH = 2;
export const SLUG_FORMAT_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

export const RESERVED_SLUGS = [
  "auth",
  "admin",
  "dashboard",
  "api",
  "org",
  "_next",
  "public",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "settings",
  "account",
  "help",
  "docs",
  "blog",
  "pricing",
  "about",
  "contact",
  "terms",
  "privacy",
  "support",
  "new",
  "invite",
] as const;

export type ReservedSlug = (typeof RESERVED_SLUGS)[number];

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase() as ReservedSlug);
}

export function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_SLUG_LENGTH);
}

export const slugSchema = z
  .string()
  .min(MIN_SLUG_LENGTH, `Slug must be at least ${MIN_SLUG_LENGTH} characters`)
  .max(MAX_SLUG_LENGTH, `Slug must be less than ${MAX_SLUG_LENGTH} characters`)
  .regex(
    SLUG_FORMAT_REGEX,
    "Must contain only lowercase letters, numbers, and dashes, and cannot start or end with a dash"
  )
  .refine(
    (val) => !isReservedSlug(val),
    "This slug is reserved and cannot be used"
  );
