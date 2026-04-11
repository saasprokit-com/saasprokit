import { z } from "zod";

// ── Constants ────────────────────────────────────────────────────────

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

const MAX_EMAIL_LENGTH = 255;
export const emailSchema = z.email().max(MAX_EMAIL_LENGTH);

const EMAIL_SPLIT_REGEX = /[,;\n\s]+/;

export function parseEmailInput(input: string): string[] {
  return input
    .split(EMAIL_SPLIT_REGEX)
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}
