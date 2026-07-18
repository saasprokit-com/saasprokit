import { z } from "zod";

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

export const MAX_EMAIL_LENGTH = 255;
export const EMAIL_SPLIT_REGEX = /[,;\n\s]+/;

export const passwordSchema = z
  .string()
  .min(
    MIN_PASSWORD_LENGTH,
    `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
  )
  .max(
    MAX_PASSWORD_LENGTH,
    `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters`
  )
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const emailSchema = z.email().max(MAX_EMAIL_LENGTH);

// Parse a string of emails separated by commas, semicolons, whitespace, or newlines into an array of trimmed, lowercase emails
// Empty strings are filtered out
export function parseEmailInput(input: string): string[] {
  return input
    .split(EMAIL_SPLIT_REGEX)
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}
