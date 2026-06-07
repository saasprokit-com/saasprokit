/**
 * Centralized route definitions for the entire app.
 * Static constants + dynamic helpers in one place.
 */

// ─── Static page routes ─────────────────────────────────────────────────────

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

  // Invite
  INVITE: "/invite",
  INVITE_ACCEPT: "/invite/accept",
} as const;

// ─── Middleware route prefixes ───────────────────────────────────────────────

/**
 * Routes that are publicly accessible without authentication.
 * Everything NOT in this list (and not an auth route) requires a session.
 * This is a default-deny approach — safer than enumerating protected routes,
 * because dynamic org-slug routes (e.g. /acme/billing) are automatically protected.
 */
export const PUBLIC_ROUTE_PREFIXES = [PAGE_ROUTES.HOME] as const;

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

// ─── Dynamic route helpers ───────────────────────────────────────────────────

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
} as const;

/**
 * Account route helpers.
 */
export const accountRoutes = {
  profile: () => PAGE_ROUTES.ACCOUNT_PROFILE,
  security: () => PAGE_ROUTES.ACCOUNT_SECURITY,
  danger: () => PAGE_ROUTES.ACCOUNT_DANGER,
  newOrg: () => PAGE_ROUTES.ACCOUNT_NEW_ORG,
} as const;

// ─── API routes ──────────────────────────────────────────────────────────────

export const API_ROUTES = {
  AUTH: "/api/auth",
  HEALTH: "/api/health",
  UPLOAD: "/api/upload",
  STRIPE_WEBHOOK: "/api/stripe/webhook",
  USER_ACTIVITY: "/api/user/activity",
} as const;
