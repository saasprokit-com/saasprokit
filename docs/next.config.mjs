import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

const OLD_HOST = [{ type: "host", value: "docs.saasprokit.com" }];
const DOCS_URL = "https://saasprokit.com/docs";

/** @type {import('next').NextConfig} */
const config = {
  // Docker/VPS needs the standalone server; the OpenNext/Cloudflare build
  // (CF_BUILD=1) and Vercel both do their own bundling and must not use it.
  output: process.env.CF_BUILD || process.env.VERCEL ? undefined : "standalone",
  // Serves at saasprokit.com/docs. Fumadocs' loader baseUrl is "/" so this is
  // the only thing prefixing URLs — the two would otherwise stack to /docs/docs.
  basePath: "/docs",
  reactStrictMode: true,
  turbopack: { root: "../" },
  // Retires docs.saasprokit.com. Sources are basePath-prefixed unless opted out;
  // external destinations never are.
  redirects() {
    return [
      {
        source: "/:path+",
        has: OLD_HOST,
        destination: `${DOCS_URL}/:path+`,
        permanent: true,
      },
      {
        source: "/",
        has: OLD_HOST,
        destination: DOCS_URL,
        permanent: true,
      },
      {
        source: "/",
        basePath: false,
        has: OLD_HOST,
        destination: DOCS_URL,
        permanent: true,
      },
    ];
  },
};

export default withMDX(config);
