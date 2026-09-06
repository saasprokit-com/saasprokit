import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker/VPS needs the standalone server; the OpenNext/Cloudflare build
  // (CF_BUILD=1) and Vercel both do their own bundling and must not use it
  output: process.env.CF_BUILD || process.env.VERCEL ? undefined : "standalone",

  // Monorepo root for Turbopack resolution (two levels up from apps/web/)
  turbopack: {
    root: "../../",
    // Workers can't run the pg driver (raw TCP + the optional pg-cloudflare
    // native socket, which esbuild cannot resolve). The Neon adapter is used
    // there instead, so alias pg out of the Cloudflare build entirely.
    resolveAlias: process.env.CF_BUILD
      ? { "@prisma/adapter-pg": "./lib/stubs/prisma-adapter-pg.ts" }
      : {},
  },

  serverExternalPackages: ["@prisma/client", "stripe"],

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/**",
      },
      // The uploads CDN host comes from env so the kit ships no hardcoded
      // domain; AWS_S3_PUBLIC_URL must be present at build time
      // (apps/web/.env.production.local) for remote logos to render.
      ...(process.env.AWS_S3_PUBLIC_URL
        ? [
            {
              protocol: "https" as const,
              hostname: new URL(process.env.AWS_S3_PUBLIC_URL).hostname,
              pathname: "/**",
            },
          ]
        : []),
    ],
  },

  // CSRF protection via Origin header validation on server actions
  experimental: {
    serverActions: {
      allowedOrigins: [
        new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
          .host,
      ],
      bodySizeLimit: "5mb",
    },
  },

  // Security headers for all responses
  headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Strict-Transport-Security: Force HTTPS connections
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // X-Content-Type-Options: Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // X-Frame-Options: Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // X-XSS-Protection: Legacy XSS protection (modern browsers ignore)
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Referrer-Policy: Control referrer information
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions-Policy: Control browser features
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
          },
          // Content-Security-Policy is set dynamically in middleware.ts with per-request nonces
        ],
      },
    ];
  },
};

export default nextConfig;
