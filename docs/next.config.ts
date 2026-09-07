import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";
import { DOCS_PATH, DOCS_URL } from "./lib/site";

const withMDX = createMDX();

const OLD_HOST = [{ type: "host" as const, value: "docs.saasprokit.com" }];

const config: NextConfig = {
  output: process.env.CF_BUILD || process.env.VERCEL ? undefined : "standalone",
  basePath: DOCS_PATH,
  reactStrictMode: true,
  turbopack: { root: "../" },
  redirects() {
    return Promise.resolve([
      {
        source: `${DOCS_PATH}/:path+`,
        basePath: false as const,
        has: OLD_HOST,
        destination: `${DOCS_URL}/:path+`,
        permanent: true,
      },
      {
        source: "/:path*",
        basePath: false as const,
        has: OLD_HOST,
        destination: DOCS_URL,
        permanent: true,
      },
    ]);
  },
};

export default withMDX(config);
