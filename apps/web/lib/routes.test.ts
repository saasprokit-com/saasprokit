import { describe, expect, it } from "vitest";
import {
  accountRoutes,
  AUTH_ROUTE_PREFIXES,
  orgRoutes,
  PAGE_ROUTES,
  PUBLIC_ROUTE_PREFIXES,
} from "./routes";

describe("orgRoutes", () => {
  it("builds org-scoped paths from a slug", () => {
    expect(orgRoutes.home("acme")).toBe("/acme");
    expect(orgRoutes.billing("acme")).toBe("/acme/billing");
    expect(orgRoutes.settings("acme")).toBe("/acme/settings");
    expect(orgRoutes.members("acme")).toBe("/acme/members");
    expect(orgRoutes.membersInvitations("acme")).toBe(
      "/acme/members/invitations"
    );
    expect(orgRoutes.membersInviteLinks("acme")).toBe(
      "/acme/members/invite-links"
    );
  });

  it("never produces double slashes", () => {
    for (const build of Object.values(orgRoutes)) {
      expect(build("acme")).not.toMatch(/\/\//);
    }
  });
});

describe("accountRoutes", () => {
  it("maps to /account subpaths", () => {
    for (const build of Object.values(accountRoutes)) {
      expect(build()).toMatch(/^\/account\//);
    }
  });
});

describe("middleware route prefixes", () => {
  it("auth prefixes all live under /auth so startsWith matching cannot leak", () => {
    expect(AUTH_ROUTE_PREFIXES.length).toBeGreaterThan(0);
    for (const prefix of AUTH_ROUTE_PREFIXES) {
      expect(prefix).toMatch(/^\/auth\//);
    }
  });

  it("public and auth prefixes do not overlap", () => {
    for (const publicRoute of PUBLIC_ROUTE_PREFIXES) {
      expect(AUTH_ROUTE_PREFIXES).not.toContain(publicRoute);
    }
  });

  it("keeps the default-deny posture: dynamic org slugs are not public", () => {
    // PUBLIC_ROUTE_PREFIXES is matched with exact equality in proxy.ts,
    // so anything beyond these literal paths requires a session.
    for (const publicRoute of PUBLIC_ROUTE_PREFIXES) {
      expect(publicRoute).not.toBe("/acme");
      expect(publicRoute.startsWith("/auth")).toBe(false);
    }
    expect(PUBLIC_ROUTE_PREFIXES).toContain(PAGE_ROUTES.HOME);
  });
});
