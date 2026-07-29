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

  const normalized = email.trim().toLowerCase();
  return adminEmailsCsv
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized);
}
