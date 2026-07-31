---
name: deployment
description: Use when deploying this app to Cloudflare Workers, Vercel, or AWS/Docker, when changing anything under packages/database, packages/auth, packages/storage or packages/email that a non-Node runtime must run, or when a feature works locally and on Vercel but fails on Cloudflare. Covers which changes are host-specific, which are shared, and what each host requires.
---

# Deployment

Three supported targets from one codebase. **Vercel** and **Docker/AWS** run Node and need no
changes. **Cloudflare Workers** runs `workerd`, which has no Node `http`, no raw TCP, no
filesystem, and no runtime WASM compilation — every incompatibility below comes from that.

**Rule: app code depends only on `process.env` and Web/Node standards.** Host APIs live in leaf
files (`wrangler.jsonc`, `open-next.config.ts`) that only that host reads.

## Deploy

```bash
pnpm --filter=app run deploy     # Cloudflare — build vars come from apps/web/.env.production.local
docker build -f apps/web/Dockerfile .    # Docker/AWS
# Vercel: git push, root apps/web — vercel.json forces the Turbo build (see apps/docs deployment/vercel)
```

`pnpm run setup` is the customer entry point (interactive: project name, deploy target, dev env
vars). It prunes the other hosts' files/scripts/devDeps and removes its own tooling, then
reinstalls. The host manifest lives in `scripts/hosts.ts` — **new host-specific files MUST be
added there**, or the CI `setup-cli` job ships them to the wrong customers.

**Adding a second host is not just code.** Every non-secret runtime value lives in
`wrangler.jsonc` `vars` and is read *only* by Cloudflare: `EMAIL_PROVIDER`, `STORAGE_PROVIDER`,
`AWS_REGION`/`AWS_S3_BUCKET`/`AWS_S3_PUBLIC_URL`/`AWS_S3_ENDPOINT`, `BETTER_AUTH_URL`. Cloudflare
build vars additionally live in gitignored `apps/web/.env.production.local`. Re-declare all of it
in the other host's dashboard — otherwise the env-driven seams below silently fall back to
`local` disk storage and `nodemailer`, both of which fail on a read-only serverless filesystem.

## The four env-driven seams

Behavior is selected at runtime, never forked per host:

| Seam | File | Selector |
|---|---|---|
| DB driver | `packages/database/index.ts` `createAdapter()` | `navigator.userAgent === "Cloudflare-Workers"` OR `CF_BUILD` → Neon; else `pg` |
| Storage | `packages/storage/providers/index.ts` | `STORAGE_PROVIDER=local\|s3`; `AWS_S3_ENDPOINT` makes `s3` serve R2/MinIO |
| Email | `packages/email/providers/index.ts` | `EMAIL_PROVIDER=resend\|nodemailer` |
| Build output | `apps/web/next.config.ts` | `output: process.env.CF_BUILD ? undefined : "standalone"` |

## Cloudflare-only — inert on other hosts

`wrangler.jsonc` · `open-next.config.ts` · `public/_headers` · `.dev.vars` ·
`lib/stubs/prisma-adapter-pg.ts` + the `CF_BUILD`-gated `turbopack.resolveAlias` ·
`@opennextjs/cloudflare`/`wrangler` devDeps.

## Shared code that Cloudflare forced to change

All verified in production. Four fail **only at runtime on workerd** — typecheck, `next dev`,
and even the REST API all pass while they are broken.

| Change | Why | Other hosts |
|---|---|---|
| `middleware.ts`, not `proxy.ts` | Next 16 pins `proxy` to the Node runtime and forbids a `runtime` override; OpenNext exits on Node middleware (`dist/cli/build/build.js:65`). Edge middleware has no TCP, so the session check is an optimistic `getSessionCookie()` — layouts still call `requireAuth` | ✅ Works everywhere (convention is deprecated) |
| `Stripe.createFetchHttpClient()` in `packages/auth/stripe-client.ts` | Without `httpClient` the SDK picks `createNodeHttpClient`. `stripe` is in `serverExternalPackages`, so its own `workerd` export condition never applies | ✅ `fetch` is global on Node 18+ |
| Plain numbers, never `BigInt`, across the Prisma boundary (`apps/web/lib/auth/rate-limit.ts`) | The wasm query compiler JSON-encodes query args: *"Do not know how to serialize a BigInt"*. `lastRequest` stays a BigInt **column**; only the values passed in/out are numbers, wrapped in `Number()` on read | ✅ Prisma accepts numbers for BigInt columns |
| `ipAddressHeaders: ["cf-connecting-ip", "x-real-ip"]` (`packages/auth/ip-headers.ts`) | No IP resolves behind a CDN, so Better Auth collapses every visitor into one `no-trusted-ip` bucket — 3 signups lock out the whole site. Bare `x-forwarded-for` is excluded: a client can forge it | ⚠️ Vercel sets `x-real-ip`. **Bare Docker with no reverse proxy sets neither** — nginx/ALB must add it |
| `runtime = "workerd"` in the Prisma generator | Prisma 7 embeds its query compiler as base64 WASM and instantiates it at runtime, which workerd forbids (*"Wasm code generation disallowed by embedder"*) | ⚠️ **The one item to revisit — for the un-pruned maintainer repo only.** `pnpm run setup` removes this line for vercel/docker customer projects, so they get the standard Node client; the workerd-on-Node question doesn't apply to them. It still applies to this repo, which is never pruned: local `next dev` verified working, Vercel/Docker **not yet** verified. **Pending verification** — update this row with the result after the maintainer's own Vercel deploy. Fix if needed: two generate outputs behind a `workerd` export condition in `packages/database/package.json` |

## Cloudflare requirements

- **Workers Paid ($5/mo).** Bundle is ~7 MiB gzipped; free tier caps at 3 MiB.
- `compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"]`.
- `DATABASE_URL` = Neon **pooled** (`-pooler`) endpoint. Migrations need a separate unpooled
  `DIRECT_URL` — `prisma.config.ts` prefers it.
- `STORAGE_PROVIDER=s3` and `EMAIL_PROVIDER=resend` are mandatory: the local provider writes to
  `node:fs` and nodemailer needs TCP.
- `public/_headers` — Workers Assets serves static files *before* the worker, so the `headers()`
  block in `next.config.ts` never reaches `/_next/static/*`.
- Build vars come from gitignored `apps/web/.env.production.local`. It outranks `.env.local`, so
  its localhost values cannot shadow them and bake a broken URL into the bundle.

**Vercel, for comparison:** Hobby plan request bodies cap at 4.5 MB — that's why the kit's upload
limit (`MAX_FILE_SIZE_MB` in `packages/utils/storage.ts`) is set to 4 MB.

## Verified, so don't re-investigate

- The Prisma WASM **does** reach the worker bundle and run — no esbuild loader or `rules` entry
  needed once `runtime = "workerd"` is set.
- `@better-auth/stripe` webhook verification works on workerd (it prefers `constructEventAsync`).
  Proven by a real subscription writing a `subscription` row.
- Interactive `$transaction` works over the Neon WebSocket pool.
- Keeping the `output` conditional is correct. OpenNext also sets standalone mode itself, but
  Docker reads this file too — deleting it breaks `node server.js`.

## Known issue

Prisma's Neon adapter uses a **WebSocket** pool, which cannot persist across Workers isolates.
Result: queries run 950ms–2.5s and ~2% of requests fail with *"Cannot perform I/O on behalf of a
different request"*. `poolQueryViaFetch` does not help — it only affects `pool.query()`, which
the adapter bypasses. Fix is **Hyperdrive** (free on the paid plan), which keeps warm pooled
connections and retains interactive transactions. `PrismaNeonHttp` is faster but cannot do
interactive transactions: four callback-form `$transaction` sites exist — `members/actions.ts`
(ownership transfer, with a TOCTOU guard), `lib/files/actions.ts` ×2, and
`lib/organization/personal-org.ts` (currently unreachable — `createDefaultWorkspace` has no
callers) — so scope that route against three reachable rewrites. The two array-form batches are
fine either way.

## Verify before deploying server changes

```bash
pnpm --filter=app run preview     # localhost:8787 on real workerd
```

This is the only check that catches workerd failures. Then exercise: a protected route
redirecting, sign-in, **creating an org** (interactive transaction), an image upload, and a
signed Stripe event. Drive server actions **through the form** — the `/api/auth/*` routes skip
`enforceRateLimit`, so `curl` misses that whole path.

Typecheck and tests are necessary but not sufficient — see Common mistakes. For the *deployed*
worker, `npx wrangler tail saasprokit-web --format pretty` streams live logs (it attaches to the
deployed worker, not to local `preview`, which logs to its own terminal). Errors surface there,
not in the browser.

## Common mistakes

- **Trusting typecheck or `next dev`.** Both passed while four separate production bugs were live.
- **Testing the REST API instead of the form.** Server actions call `enforceRateLimit`; the
  `/api/auth/*` routes do not. A BigInt crash in that path was invisible to `curl`.
- **`prisma migrate diff > file`.** The CLI writes `Loaded Prisma config…` to stdout and corrupts
  the SQL. Always `-o <file>`. This is what broke the original `0_init` migration.
- **Running the dev seed.** `packages/database/prisma/seed.ts` opens with 15 `deleteMany()` calls
  and creates accounts sharing a repo-committed password. First admin comes from `ADMIN_EMAILS`
  at signup instead.
