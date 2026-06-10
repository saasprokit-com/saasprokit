/**
 * Sync Better Auth error codes into the en dictionary (`errors.ba`).
 *
 * Run after a Better Auth upgrade when the type bridge in
 * `lib/auth/ba-error-core.ts` fails typecheck, then re-translate:
 *
 *   cd apps/web
 *   NODE_OPTIONS="--conditions=react-server" npx tsx --env-file=.env.local scripts/sync-ba-errors.ts
 *   pnpm translate
 *
 * - Adds new codes with Better Auth's English message as the initial copy
 * - Removes codes Better Auth no longer ships
 * - Preserves existing hand-tuned copy
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
// AUTH_ERROR_CODES (not auth.$ERROR_CODES) so stripe codes are included even
// when Stripe env vars are absent and the stripe plugin isn't registered —
// otherwise this script would prune them and break the type bridge.
import { AUTH_ERROR_CODES } from "@repo/auth/server";

function findWorkspaceRoot(startDir: string): string {
  let current = startDir;
  while (!existsSync(join(current, "pnpm-workspace.yaml"))) {
    const parent = dirname(current);
    if (parent === current) {
      throw new Error("pnpm-workspace.yaml not found above cwd");
    }
    current = parent;
  }
  return current;
}

const EN_JSON = join(
  findWorkspaceRoot(process.cwd()),
  "packages/internationalization/dictionaries/en.json"
);

function baMessage(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object" && "message" in value) {
    return String((value as { message: unknown }).message);
  }
  return String(value);
}

const codes: Record<string, unknown> = AUTH_ERROR_CODES;
const dict = JSON.parse(readFileSync(EN_JSON, "utf8"));
const existing: Record<string, string> = dict.errors.ba ?? {};

const added: string[] = [];
const removed = Object.keys(existing).filter((key) => !(key in codes));

const next: Record<string, string> = {};
for (const code of Object.keys(codes).sort((a, b) => a.localeCompare(b))) {
  if (!(code in existing)) {
    added.push(code);
  }
  next[code] = existing[code] ?? baMessage(codes[code]);
}

dict.errors.ba = next;
writeFileSync(EN_JSON, `${JSON.stringify(dict, null, 2)}\n`);

console.log(`errors.ba: ${Object.keys(next).length} codes`);
console.log(`added (${added.length}):`, added.join(", ") || "none");
console.log(`removed (${removed.length}):`, removed.join(", ") || "none");
if (added.length > 0) {
  console.log(
    "\nNext: review the new English copy, then run `pnpm translate`."
  );
}
