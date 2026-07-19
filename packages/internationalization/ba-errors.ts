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
