import { internationalizationMiddleware } from "@repo/internationalization/proxy";
import { locales } from "@repo/internationalization/shared";
import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import {
  AUTH_ROUTE_PREFIXES,
  PAGE_ROUTES,
  PUBLIC_ROUTE_EXACT,
  PUBLIC_ROUTE_PREFIXES,
} from "@/lib/routes";

// Edge middleware (middleware.ts, not proxy.ts): Next 16's proxy convention is
// Node-runtime-only, which OpenNext/Cloudflare cannot run, and a DB-backed
// session check here would break Vercel's Edge runtime (no TCP). This layer
// therefore does an OPTIMISTIC cookie-presence check only — real session
// verification happens in the route-group layouts (requireAuth/getServerSession)
// and in server actions (verifySession).

const HTTP_OK = 200;

/**
 * Route matching must work identically for `/org`, `/vi/org`, `/fr/org`, etc.
 */
function stripLocale(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1);
    }
    if (pathname === `/${locale}`) {
      return "/";
    }
  }
  return pathname;
}

/**
 * The nonce is also set as `x-nonce` so Server Components can read it via `headers()`.
 */
function applyNonceCsp(response: NextResponse): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // React/Next.js need eval() for dev-only debugging (HMR, call-stack
  // reconstruction). Never emitted in production, where React avoids eval().
  const scriptSrc =
    process.env.NODE_ENV === "development"
      ? `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`
      : `script-src 'self' 'nonce-${nonce}'`;

  response.headers.set("x-nonce", nonce);
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      scriptSrc,
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
    ].join("; ")
  );

  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Skip middleware for API routes and static files
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Run i18n middleware first (handles locale detection and redirects)
  const i18nResponse = internationalizationMiddleware(request);
  if (i18nResponse.status !== HTTP_OK) {
    return i18nResponse;
  }

  // Strip locale prefix so route checks work for all locales
  const normalizedPath = stripLocale(pathname);

  // Check if this is an auth route (redirect logged-in users away)
  const isAuthRoute = AUTH_ROUTE_PREFIXES.some((route) =>
    normalizedPath.startsWith(route)
  );

  const isPublicRoute =
    PUBLIC_ROUTE_EXACT.some((route) => route === normalizedPath) ||
    PUBLIC_ROUTE_PREFIXES.some((route) => normalizedPath.startsWith(route));

  // Public routes don't need session checks
  if (isPublicRoute && !isAuthRoute) {
    return applyNonceCsp(i18nResponse);
  }

  // Presence of the httpOnly session cookie — spoofing it only gets an
  // attacker past this redirect; every layout re-verifies against the DB
  const hasSessionCookie = Boolean(getSessionCookie(request));

  // Redirect unauthenticated users away from protected routes
  if (!(isAuthRoute || hasSessionCookie)) {
    const signInUrl = new URL(PAGE_ROUTES.SIGN_IN, request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }
  // Redirect authenticated users away from auth routes
  if (isAuthRoute && hasSessionCookie) {
    return NextResponse.redirect(new URL(PAGE_ROUTES.ORG, request.url));
  }

  // Return i18n response (may have modified headers for locale)
  return applyNonceCsp(i18nResponse);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
