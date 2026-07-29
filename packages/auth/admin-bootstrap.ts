import { parseEmailInput } from "@repo/utils/user";

// Solves the first-admin chicken-and-egg: /admin requires an admin, but the
// only role-change endpoint requires an existing admin. Emails listed in
// ADMIN_EMAILS are promoted at signup instead (see databaseHooks in server.ts).
export function isBootstrapAdminEmail(
  email: string,
  adminEmailsCsv: string | undefined
): boolean {
  if (!(email && adminEmailsCsv)) {
    return false;
  }

  // Shared with the bulk-invite UI, so ADMIN_EMAILS accepts the same separators
  // a user would reasonably type — commas, semicolons, spaces or newlines
  return parseEmailInput(adminEmailsCsv).includes(email.trim().toLowerCase());
}
