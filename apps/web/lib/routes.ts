export const PAGE_ROUTES = {
  // Public (frontier)
  HOME: "/",

  // Auth
  SIGN_IN: "/auth/sign-in",
  SIGN_UP: "/auth/sign-up",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  MAGIC_LINK: "/auth/magic-link",
  VERIFY_EMAIL: "/auth/verify-email",
  TWO_FACTOR: "/auth/2fa",

  // Organization management
  ORG: "/org",

  // Account
  ACCOUNT: "/account",
  ACCOUNT_PROFILE: "/account/profile",
  ACCOUNT_SECURITY: "/account/security",
  ACCOUNT_DANGER: "/account/danger",
  ACCOUNT_NEW_ORG: "/account/new-org",

  // Platform admin
  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_ORGANIZATIONS: "/admin/organizations",

  // Invite
  INVITE: "/invite",
  INVITE_ACCEPT: "/invite/accept",
} as const;

// ─── Middleware route prefixes ───────────────────────────────────────────────

/**
 * HOME must be exact: as a prefix, "/" would match every path in the app.
 */
export const PUBLIC_ROUTE_EXACT = [PAGE_ROUTES.HOME] as const;

/**
 * Publicly accessible paths matched by `startsWith` — marketing/legal pages and
 * anything else that must render (including its 404) without a session.
 *
 * Add new public routes here. Anything NOT listed in either allowlist, and not
 * an auth route, still requires a session: the app's org pages live at the top
 * level (`/[orgSlug]`), so at the edge an unknown `/typo` is indistinguishable
 * from a real `/acme` without a database lookup, and default-deny is the safe
 * answer for that ambiguity.
 */
export const PUBLIC_ROUTE_PREFIXES = [PAGE_ROUTES.INVITE] as readonly string[];

/**
 * Sanitize a post-auth redirect target. Only same-origin relative paths are
 * allowed; anything else (absolute URLs, protocol-relative `//host`, backslash
 * or control-character tricks, empty/invalid input) falls back to the org
 * dashboard. Guards against open-redirect via the `callbackUrl` query param —
 * the sole guard on the password/OTP sign-in path, where the client
 * `router.push`es this value and Better Auth never sees it.
 */
export function resolveCallbackUrl(raw: string | null | undefined): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) {
    return PAGE_ROUTES.ORG;
  }
  try {
    // Resolve against a sentinel origin so the parser normalizes exactly as the
    // browser will (strips tab/newline, folds `\` to `/`), then rebuild from the
    // parsed parts so the raw string never reaches the redirect. A denylist misses
    // `/\t/evil.com`, which the URL parser degrades to protocol-relative `//evil.com`.
    const url = new URL(raw, "https://x.invalid");
    if (url.origin !== "https://x.invalid") {
      return PAGE_ROUTES.ORG;
    }
    return url.pathname + url.search;
  } catch {
    return PAGE_ROUTES.ORG;
  }
}

/**
 * Auth pages that should redirect logged-in users away.
 * Matched with startsWith in the proxy middleware.
 */
export const AUTH_ROUTE_PREFIXES = [
  PAGE_ROUTES.SIGN_IN,
  PAGE_ROUTES.SIGN_UP,
  PAGE_ROUTES.FORGOT_PASSWORD,
  PAGE_ROUTES.RESET_PASSWORD,
  PAGE_ROUTES.MAGIC_LINK,
  PAGE_ROUTES.VERIFY_EMAIL,
  PAGE_ROUTES.TWO_FACTOR,
] as const;

/**
 * Org page subpaths for cache revalidation.
 */
export const ORG_PAGES = {
  MEMBERS: "members",
  SETTINGS: "settings",
  BILLING: "billing",
  TEAMS: "teams",
  INVITATION: "members/invitations",
  INVITE_LINKS: "members/invite-links",
  AI: "ai",
} as const;

/**
 * Organization-scoped route helpers (requires a slug).
 */
export const orgRoutes = {
  home: (slug: string) => `/${slug}`,
  members: (slug: string) => `/${slug}/${ORG_PAGES.MEMBERS}`,
  membersInvitations: (slug: string) => `/${slug}/${ORG_PAGES.INVITATION}`,
  membersInviteLinks: (slug: string) => `/${slug}/${ORG_PAGES.INVITE_LINKS}`,
  settings: (slug: string) => `/${slug}/${ORG_PAGES.SETTINGS}`,
  billing: (slug: string) => `/${slug}/${ORG_PAGES.BILLING}`,
  ai: (slug: string) => `/${slug}/${ORG_PAGES.AI}`,
  aiConversation: (slug: string, conversationId: string) =>
    `/${slug}/${ORG_PAGES.AI}/${conversationId}`,
} as const;

export const accountRoutes = {
  profile: () => PAGE_ROUTES.ACCOUNT_PROFILE,
  security: () => PAGE_ROUTES.ACCOUNT_SECURITY,
  danger: () => PAGE_ROUTES.ACCOUNT_DANGER,
  newOrg: () => PAGE_ROUTES.ACCOUNT_NEW_ORG,
} as const;

/**
 * Platform-admin page subpaths for cache revalidation (mirrors ORG_PAGES).
 * DASHBOARD is "" — the /admin index itself.
 */
export const ADMIN_PAGES = {
  DASHBOARD: "",
  USERS: "users",
} as const;

export const adminRoutes = {
  dashboard: () => PAGE_ROUTES.ADMIN,
  users: () => PAGE_ROUTES.ADMIN_USERS,
  user: (userId: string) => `${PAGE_ROUTES.ADMIN_USERS}/${userId}`,
  organizations: () => PAGE_ROUTES.ADMIN_ORGANIZATIONS,
  organization: (orgId: string) =>
    `${PAGE_ROUTES.ADMIN_ORGANIZATIONS}/${orgId}`,
} as const;

export const API_ROUTES = {
  AUTH: "/api/auth",
  HEALTH: "/api/health",
  USER_ACTIVITY: "/api/user/activity",
  AI_CHAT: "/api/ai/chat",
} as const;
