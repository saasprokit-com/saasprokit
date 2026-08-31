---
name: deployment
description: Use when deploying this app to Cloudflare Workers, Vercel, or AWS/Docker, when changing packages/database, packages/auth, packages/storage or packages/email in ways a non-Node runtime must run, or when a feature works locally and on Vercel but fails on Cloudflare.
---

# Deployment

Three supported targets from one codebase. **Vercel** and **Docker/AWS** run Node and
need no changes. **Cloudflare Workers** runs `workerd`, which has no Node `http`, no
raw TCP, no filesystem, and no runtime WASM compilation — every incompatibility below
comes from that.

**Rule: app code depends only on `process.env` and Web/Node standards.** Host APIs
live in leaf files (`wrangler.jsonc`, `open-next.config.ts`) that only that host
reads.

## Deploy

```bash
pnpm --filter app run deploy              # Cloudflare — build vars from apps/web/.env.production.local
pnpm --filter app run preview             # localhost:8787 on real workerd
docker build -f apps/web/Dockerfile .     # Docker/AWS
# Vercel: git push, root apps/web — vercel.json forces the Turbo build
```

`pnpm run setup` is the customer entry point. It prunes the other hosts'
files/scripts/devDeps, removes its own tooling, then reinstalls. **`scripts/hosts.ts`
is the ONLY thing deciding what each host's customers receive** — any new
host-specific file MUST be added there, or customers on other hosts get it. The CI
`setup-cli` job is a partial net: it fails only when an omission happens to break the
pruned typecheck.

**Adding a second host is not just code.** Non-secret runtime values live in
`wrangler.jsonc` `vars`, read *only* by Cloudflare: `EMAIL_PROVIDER`,
`STORAGE_PROVIDER`, `AWS_REGION`, `AWS_S3_BUCKET` (plus `BETTER_AUTH_URL` and
`AWS_S3_PUBLIC_URL`, commented until you have the URLs). Build vars additionally live
in gitignored `apps/web/.env.production.local`. Re-declare all of it in the other
host's dashboard — otherwise the seams below silently fall back to `local` disk
storage and `nodemailer`, both of which fail on a read-only serverless filesystem.

## The four env-driven seams

Behavior is selected at runtime, never forked per host:

| Seam | File | Selector |
|---|---|---|
| DB driver | `packages/database/index.ts` `createAdapter()` | `navigator.userAgent === "Cloudflare-Workers"` OR `CF_BUILD` → Neon; else `pg` |
| Storage | `packages/storage/providers/index.ts` | `STORAGE_PROVIDER=local\|s3`; `AWS_S3_ENDPOINT` makes `s3` serve R2/MinIO |
| Email | `packages/email/providers/index.ts` | `EMAIL_PROVIDER=resend\|nodemailer` |
| Build output | `apps/web/next.config.ts` | `output: CF_BUILD \|\| VERCEL ? undefined : "standalone"` |

## Cloudflare-only — inert on other hosts

`wrangler.jsonc` · `open-next.config.ts` · `public/_headers` · `.dev.vars` ·
`lib/stubs/prisma-adapter-pg.ts` + the `CF_BUILD`-gated `turbopack.resolveAlias` ·
`@opennextjs/cloudflare`/`wrangler` devDeps.

## Shared code that Cloudflare forced to change

All verified in production. Four fail **only at runtime on workerd** — typecheck,
`next dev`, and even the REST API all pass while they are broken.

| Change | Why | Other hosts |
|---|---|---|
| `middleware.ts`, not `proxy.ts` | Next 16 pins `proxy` to the Node runtime and forbids a `runtime` override; OpenNext exits on Node middleware. Edge middleware has no TCP, so the session check is an optimistic `getSessionCookie()` — layouts still call `requireAuth` | ✅ Works everywhere (convention is deprecated) |
| `Stripe.createFetchHttpClient()` in `packages/auth/stripe-client.ts` | Without `httpClient` the SDK picks `createNodeHttpClient`. `stripe` is in `serverExternalPackages`, so its own `workerd` export condition never applies | ✅ `fetch` is global on Node 18+ |
| Plain numbers, never `BigInt`, across the Prisma boundary (`apps/web/lib/auth/rate-limit.ts`) | The wasm query compiler JSON-encodes query args: *"Do not know how to serialize a BigInt"*. `lastRequest` stays a BigInt **column**; only the values passed in/out are numbers, wrapped in `Number()` on read | ✅ Prisma accepts numbers for BigInt columns |
| `ipAddressHeaders: ["cf-connecting-ip", "x-real-ip", "x-forwarded-for"]` (`packages/auth/ip-headers.ts`) | No IP resolves behind a CDN otherwise, so Better Auth collapses every visitor into one `no-trusted-ip` bucket — 3 signups lock out the whole site. `x-forwarded-for` stays in as the last resort for hosts whose proxy sets nothing else (ALB, nginx, Docker): Better Auth only trusts it when single-valued, rejecting a client-forged chain | ⚠️ Vercel sets `x-real-ip`. **Bare Docker with no reverse proxy sets none of the three** — legit traffic collapses back into the `no-trusted-ip` bucket, and a forged single-valued `x-forwarded-for` mints a fresh bucket per request. nginx/ALB must set one, or set `advanced.ipAddress.trustedProxies` |
| `runtime = "workerd"` in the app `client` generator (`schema.prisma`) | Prisma 7 embeds its query compiler as base64 WASM and instantiates it at runtime, which workerd forbids (*"Wasm code generation disallowed by embedder"*) | ⚠️ **Open item, maintainer repo only** — see below |

**The `runtime = "workerd"` open item.** `setup` removes this line for vercel/docker
customer projects, so they get the standard Node client — it doesn't apply to them. It
does apply to this repo, which is never pruned: local `next dev` verified working;
Vercel/Docker **not yet verified**. Update this section after the maintainer's own
Vercel deploy.

A second generator, `clientNode` (output `../generated/client-node`), now exists
alongside the app client — not to close this item, but because the workerd client's
WASM engine cannot initialize under `tsx`. `packages/database/prisma/seed.ts` is its
only consumer; the app `client` generator above still targets workerd and is what
this open item is about.

## Cloudflare requirements

- **Workers Paid ($5/mo).** Bundle is ~7 MiB gzipped; free tier caps at 3 MiB.
- `compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"]`.
- `DATABASE_URL` = Neon **pooled** (`-pooler`) endpoint. Migrations need a separate
  unpooled `DIRECT_URL` — `prisma.config.ts` prefers it.
- `STORAGE_PROVIDER=s3` and `EMAIL_PROVIDER=resend` are mandatory: the local provider
  writes to `node:fs` and nodemailer needs TCP.
- `public/_headers` — Workers Assets serves static files *before* the worker, so the
  `headers()` block in `next.config.ts` never reaches `/_next/static/*`.
- Build vars come from gitignored `apps/web/.env.production.local`. It outranks
  `.env.local`, so its localhost values cannot shadow them and bake a broken URL into
  the bundle.

**Vercel, for comparison:** Hobby plan request bodies cap at 4.5 MB — that's why the
kit's upload limit (`MAX_FILE_SIZE_MB` in `packages/utils/storage.ts`) is 4 MB.

## Verified, so don't re-investigate

- The Prisma WASM **does** reach the worker bundle and run — no esbuild loader or
  `rules` entry needed once `runtime = "workerd"` is set.
- `@better-auth/stripe` webhook verification works on workerd (it prefers
  `constructEventAsync`). Proven by a real subscription writing a `subscription` row.
- Interactive `$transaction` works over the Neon WebSocket pool.
- Keeping the `output` conditional is correct. OpenNext also sets standalone mode
  itself, but Docker reads this file too — deleting it breaks `node server.js`.

## Known issue

Prisma's Neon adapter uses a **WebSocket** pool, which cannot persist across Workers
isolates: queries run 950ms–2.5s and ~2% fail with *"Cannot perform I/O on behalf of a
different request"*. `poolQueryViaFetch` does not help — it only affects
`pool.query()`, which the adapter bypasses. Fix is **Hyperdrive** (free on the paid
plan): warm pooled connections, interactive transactions retained. `PrismaNeonHttp` is
faster but cannot do interactive transactions, and four callback-form `$transaction`
sites exist — `members/actions.ts` (ownership transfer, TOCTOU guard),
`lib/files/actions.ts` ×2, and `lib/organization/personal-org.ts` (unreachable —
`createDefaultWorkspace` has no callers) — so that route costs three rewrites. The two
array-form batches are fine either way.

## Verify before deploying server changes

`pnpm --filter app run preview` is the only check that catches workerd failures. Then
exercise: a protected route redirecting, sign-in, **creating an org** (interactive
transaction), an image upload, and a signed Stripe event. Drive server actions
**through the form** — `/api/auth/*` skips `enforceRateLimit`, so `curl` misses that
path entirely.

For the *deployed* worker, `npx wrangler tail saasprokit-web --format pretty` streams
live logs (local `preview` logs to its own terminal). Errors surface there, not in the
browser.

## Common mistakes

- **Trusting typecheck or `next dev`.** Both passed while four separate production
  bugs were live.
- **Testing the REST API instead of the form.** Server actions call
  `enforceRateLimit`; the `/api/auth/*` routes do not. A BigInt crash in that path was
  invisible to `curl`.
- **`prisma migrate diff > file`.** The CLI writes `Loaded Prisma config…` to stdout
  and corrupts the SQL. Always `-o <file>`. This is what broke the original `0_init`
  migration.
- **Running the dev seed.** `packages/database/prisma/seed.ts` opens with 15
  `deleteMany()` calls and creates accounts sharing a repo-committed password. First
  admin comes from `ADMIN_EMAILS` at signup instead.
