/**
 * Better Auth error translations, fed to the @better-auth/i18n plugin.
 *
 * Eager imports on purpose: the plugin needs every locale synchronously at
 * `betterAuth()` construction, so `getDictionary`'s async dynamic import
 * cannot feed it. No "server-only" guard — consumed at module scope by
 * `@repo/auth/server`.
 *
 * Source files live in `ba-errors/[locale].json`, registered in
 * `languine.json` so `pnpm --filter internationalization translate` keeps
 * machine-translating them.
 *
 * Keys are the EXACT error codes Better Auth throws (its `$ERROR_CODES`
 * tables + BASE_ERROR_CODES), covering every registered plugin: base auth,
 * admin, email-otp, two-factor, organization, and stripe — plus app-thrown
 * codes (`CANNOT_CHANGE_OWN_ROLE`, `TRANSFER_ORGANIZATION_OWNERSHIP`).
 * To keep parity, never rename a key away from its Better Auth code, and add
 * new codes to all six files (enforced by `packages/auth/ba-i18n.test.ts`).
 * The exhaustiveness test validates all known codes are present; after
 * upgrading Better Auth, run tests to catch any new codes that need addition.
 */
import de from "./ba-errors/de.json" with { type: "json" };
import en from "./ba-errors/en.json" with { type: "json" };
import es from "./ba-errors/es.json" with { type: "json" };
import fr from "./ba-errors/fr.json" with { type: "json" };
import pt from "./ba-errors/pt.json" with { type: "json" };
import zh from "./ba-errors/zh.json" with { type: "json" };

export const baErrorTranslations = {
  en,
  es,
  de,
  zh,
  fr,
  pt,
};
