import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Monorepo root for Turbopack resolution (two levels up from apps/web/)
  turbopack: {
    root: "../../",
  },

  serverExternalPackages: [
    "@prisma/client",
    "pino",
    "pino-pretty",
    "thread-stream",
    "stripe",
  ],

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/**",
      },
    ],
  },

  // CSRF protection via Origin header validation on server actions
  experimental: {
    serverActions: {
      allowedOrigins: [
        new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
          .host,
      ],
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
          // Content-Security-Policy is set dynamically in proxy.ts with per-request nonces
        ],
      },
    ];
  },
};

export default nextConfig;
