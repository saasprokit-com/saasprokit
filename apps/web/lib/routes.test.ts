import { describe, expect, it } from "vitest";
import {
  accountRoutes,
  AUTH_ROUTE_PREFIXES,
  orgRoutes,
  PAGE_ROUTES,
  PUBLIC_ROUTE_EXACT,
  PUBLIC_ROUTE_PREFIXES,
  resolveCallbackUrl,
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

  it("public and auth routes do not overlap", () => {
    for (const publicRoute of [...PUBLIC_ROUTE_EXACT, ...PUBLIC_ROUTE_PREFIXES]) {
      expect(AUTH_ROUTE_PREFIXES).not.toContain(publicRoute);
    }
  });

  it("keeps the home page publicly reachable", () => {
    expect(PUBLIC_ROUTE_EXACT).toContain(PAGE_ROUTES.HOME);
  });

  it("never lists '/' as a startsWith prefix: it would make every path public", () => {
    // PUBLIC_ROUTE_PREFIXES is startsWith-matched in proxy.ts. "/" is a prefix of
    // every path, so listing it here would open the whole app, org pages included.
    // That is exactly why HOME lives in PUBLIC_ROUTE_EXACT instead.
    expect(PUBLIC_ROUTE_PREFIXES).not.toContain(PAGE_ROUTES.HOME);
    for (const prefix of PUBLIC_ROUTE_PREFIXES) {
      expect(prefix.startsWith("/")).toBe(true);
      expect(prefix.length).toBeGreaterThan(1);
    }
  });

  it("keeps the default-deny posture: dynamic org slugs are not public", () => {
    // Org pages live at the top level (/[orgSlug]), so no public route may match one.
    for (const publicRoute of [...PUBLIC_ROUTE_EXACT, ...PUBLIC_ROUTE_PREFIXES]) {
      expect(publicRoute).not.toBe("/acme");
      expect(publicRoute.startsWith("/auth")).toBe(false);
    }
    expect(
      [...PUBLIC_ROUTE_EXACT].some((route) => route === orgRoutes.home("acme"))
    ).toBe(false);
    expect(
      PUBLIC_ROUTE_PREFIXES.some((route) =>
        orgRoutes.home("acme").startsWith(route)
      )
    ).toBe(false);
  });

  it("exposes /invite so guests can preview and accept invitations", () => {
    expect(
      PUBLIC_ROUTE_PREFIXES.some((route) =>
        PAGE_ROUTES.INVITE_ACCEPT.startsWith(route)
      )
    ).toBe(true);
  });
});

describe("resolveCallbackUrl", () => {
  it("passes through same-origin relative paths, query string included", () => {
    expect(resolveCallbackUrl("/invite/accept?token=abc")).toBe(
      "/invite/accept?token=abc"
    );
    expect(resolveCallbackUrl("/vi/invite/xyz")).toBe("/vi/invite/xyz");
  });

  it("rejects open-redirect vectors, falling back to the org dashboard", () => {
    expect(resolveCallbackUrl("https://evil.com")).toBe(PAGE_ROUTES.ORG);
    expect(resolveCallbackUrl("//evil.com")).toBe(PAGE_ROUTES.ORG);
    expect(resolveCallbackUrl("/\\evil.com")).toBe(PAGE_ROUTES.ORG);
    expect(resolveCallbackUrl("javascript:alert(1)")).toBe(PAGE_ROUTES.ORG);
  });

  it("rejects control-character tricks the browser strips before parsing", () => {
    // Tab/newline degrade to protocol-relative `//evil.com` in the browser.
    expect(resolveCallbackUrl("/\t/evil.com")).toBe(PAGE_ROUTES.ORG);
    expect(resolveCallbackUrl("/\n/evil.com")).toBe(PAGE_ROUTES.ORG);
  });

  it("falls back to the org dashboard for empty or missing input", () => {
    expect(resolveCallbackUrl("")).toBe(PAGE_ROUTES.ORG);
    expect(resolveCallbackUrl(undefined)).toBe(PAGE_ROUTES.ORG);
    expect(resolveCallbackUrl(null)).toBe(PAGE_ROUTES.ORG);
  });
});
