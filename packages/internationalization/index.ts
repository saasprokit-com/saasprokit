import "server-only";

export {
  type ActionErrorMessages,
  DEFAULT_LOCALE,
  type Dictionary,
  locales,
} from "./shared";

import type { Dictionary } from "./shared";
import { locales } from "./shared";

const dictionaries: Record<string, () => Promise<Dictionary>> =
  Object.fromEntries(
    locales.map((locale) => [
      locale,
      () =>
        import(`./dictionaries/${locale}.json`)
          .then((mod) => mod.default)
          .catch((_err) =>
            import("./dictionaries/en.json").then((mod) => mod.default)
          ),
    ])
  );

export const getDictionary = async (locale: string): Promise<Dictionary> => {
  const normalizedLocale = locale.split("-")[0];

  // biome-ignore lint/suspicious/noExplicitAny: Dynamic locale lookup
  if (!locales.includes(normalizedLocale as any)) {
    return dictionaries.en();
  }

  try {
    return await dictionaries[normalizedLocale]();
  } catch (_error) {
    return dictionaries.en();
  }
};
