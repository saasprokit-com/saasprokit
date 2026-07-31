export type HostId = "cloudflare" | "vercel" | "docker";

export interface HostTarget {
  deleteFiles: string[];
  id: HostId;
  label: string;
  nextSteps: string[];
  prismaRuntime: "workerd" | null;
  stripDevDeps: string[];
  stripScripts: string[];
}

export const CLOUDFLARE_FILES = [
  "apps/web/wrangler.jsonc",
  "apps/web/open-next.config.ts",
  "apps/web/public/_headers",
  "apps/web/lib/stubs/prisma-adapter-pg.ts",
];

export const VERCEL_FILES = [
  "apps/web/vercel.json",
  "apps/web/scripts/skip-ci.js",
];

const CLOUDFLARE_SCRIPTS = [
  "preview",
  "deploy",
  "deploy:demo",
  "upload",
  "cf:build",
];
const CLOUDFLARE_DEV_DEPS = ["@opennextjs/cloudflare", "wrangler"];

export const HOST_TARGETS: Record<HostId, HostTarget> = {
  cloudflare: {
    id: "cloudflare",
    label: "Cloudflare Workers",
    deleteFiles: ["apps/web/Dockerfile", ...VERCEL_FILES],
    stripScripts: ["deploy:demo"],
    stripDevDeps: [],
    prismaRuntime: "workerd",
    nextSteps: [
      "Workers Paid plan required (~7 MiB bundle; free tier caps at 3 MiB).",
      "npx wrangler login",
      "npx wrangler r2 bucket create <slug>-web-cache   # ISR cache (see wrangler.jsonc)",
      "Set secrets: npx wrangler secret put DATABASE_URL (Neon POOLED -pooler URL),",
      "  BETTER_AUTH_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY,",
      "  AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_ENDPOINT (R2 endpoint).",
      "Uncomment BETTER_AUTH_URL in wrangler.jsonc vars after the first deploy.",
      "Deploy: pnpm --filter=app run deploy",
      "Verify on real workerd first: pnpm --filter=app run preview",
    ],
  },
  vercel: {
    id: "vercel",
    label: "Vercel",
    deleteFiles: [...CLOUDFLARE_FILES, "apps/web/Dockerfile"],
    stripScripts: CLOUDFLARE_SCRIPTS,
    stripDevDeps: CLOUDFLARE_DEV_DEPS,
    prismaRuntime: null,
    nextSteps: [
      "Push to GitHub, import at vercel.com/new with Root Directory: apps/web.",
      "vercel.json already forces the Turbo build (prisma generate included).",
      "Set Production env vars — EMAIL_PROVIDER, STORAGE_PROVIDER and EMAIL_FROM",
      "  MUST be re-declared here (they are not in any checked-in config for you):",
      "  NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_APP_NAME, BETTER_AUTH_URL,",
      "  BETTER_AUTH_TRUSTED_ORIGINS, BETTER_AUTH_SECRET, DATABASE_URL (pooled),",
      "  EMAIL_PROVIDER=resend, EMAIL_FROM, RESEND_API_KEY, STORAGE_PROVIDER=s3,",
      "  AWS_* (incl. AWS_S3_ENDPOINT + AWS_S3_PUBLIC_URL), STRIPE_*, OAuth ids.",
      "Never set NODE_ENV — Vercel reserves it.",
      "Add a Stripe webhook for https://<project>.vercel.app/api/auth/stripe/webhook",
      "  and your OAuth callback URLs for the new domain.",
      "Hobby plan: request bodies cap at 4.5 MB; upload limit is set to 4 MB.",
    ],
  },
  docker: {
    id: "docker",
    label: "Docker / AWS / VPS",
    deleteFiles: [...CLOUDFLARE_FILES, ...VERCEL_FILES],
    stripScripts: CLOUDFLARE_SCRIPTS,
    stripDevDeps: CLOUDFLARE_DEV_DEPS,
    prismaRuntime: null,
    nextSteps: [
      "Build: docker build -f apps/web/Dockerfile .",
      "Provide runtime env: DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL,",
      "  NEXT_PUBLIC_APP_URL, EMAIL_PROVIDER, EMAIL_FROM (+ provider creds),",
      "  STORAGE_PROVIDER (+ S3 creds when s3), STRIPE_* keys.",
      "Run behind a reverse proxy (nginx/ALB). The app resolves client IPs",
      "  from cf-connecting-ip, then x-real-ip, then x-forwarded-for — standard",
      "  proxies set x-forwarded-for by default, so no special config needed.",
      "  With NO proxy at all there is no trusted IP header and rate limiting",
      "  collapses every visitor into one bucket.",
    ],
  },
};
