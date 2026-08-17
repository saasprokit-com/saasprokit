import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  // Docker/VPS needs the standalone server; the OpenNext/Cloudflare build
  // (CF_BUILD=1) and Vercel both do their own bundling and must not use it.
  output: process.env.CF_BUILD || process.env.VERCEL ? undefined : "standalone",
  reactStrictMode: true,
  turbopack: { root: "../../" },
};

export default withMDX(config);
