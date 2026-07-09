import { auth } from "@repo/auth";
import languine from "@repo/internationalization/languine.json" with {
  type: "json",
};
import { internationalizationMiddleware } from "@repo/internationalization/proxy";
import { type NextRequest, NextResponse } from "next/server";
import {
  AUTH_ROUTE_PREFIXES,
  PAGE_ROUTES,
  PUBLIC_ROUTE_PREFIXES,
} from "@/lib/routes";

const HTTP_OK = 200;

const locales = [languine.locale.source, ...languine.locale.targets];

/**
 * Strip the locale prefix from a pathname so route matching
 * works identically for `/org`, `/vi/org`, `/fr/org`, etc.
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
 * Apply a per-request nonce and Content-Security-Policy header to the response.
 * The nonce is also set as `x-nonce` so Server Components can read it via `headers()`.
 */
function applyNonceCsp(response: NextResponse): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  response.headers.set("x-nonce", nonce);
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`,
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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Skip proxy for API routes and static files
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

  const isPublicRoute = PUBLIC_ROUTE_PREFIXES.some(
    (route) => normalizedPath === route
  );

  // Public routes don't need session checks
  if (isPublicRoute && !isAuthRoute) {
    return applyNonceCsp(i18nResponse);
  }

  try {
    // Get the session using better-auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    // Redirect unauthenticated users away from protected routes
    if (!(isAuthRoute || session)) {
      const signInUrl = new URL(PAGE_ROUTES.SIGN_IN, request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
    // Redirect authenticated users away from auth routes
    if (isAuthRoute && session) {
      return NextResponse.redirect(new URL(PAGE_ROUTES.ORG, request.url));
    }

    // Return i18n response (may have modified headers for locale)
    return applyNonceCsp(i18nResponse);
  } catch (error) {
    console.error("[proxy] Session check failed:", error);
    // Fail closed: deny access on protected routes when auth check fails
    if (!(isPublicRoute || isAuthRoute)) {
      const signInUrl = new URL(PAGE_ROUTES.SIGN_IN, request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
    // Allow public and auth routes to proceed despite auth failure
    return applyNonceCsp(i18nResponse);
  }
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
