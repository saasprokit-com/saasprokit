/**
 * Better Auth error translations for the @better-auth/i18n plugin,
 * sourced from the languine-managed dictionaries (`errors.ba` sections).
 *
 * Static imports keep this usable during auth instance construction;
 * only the server-side auth package should import this module.
 */
import de from "./dictionaries/de.json";
import en from "./dictionaries/en.json";
import es from "./dictionaries/es.json";
import fr from "./dictionaries/fr.json";
import ja from "./dictionaries/ja.json";
import ko from "./dictionaries/ko.json";
import pt from "./dictionaries/pt.json";
import sv from "./dictionaries/sv.json";
import zh from "./dictionaries/zh.json";

export const baErrorTranslations = {
  en: en.errors.ba,
  es: es.errors.ba,
  de: de.errors.ba,
  zh: zh.errors.ba,
  fr: fr.errors.ba,
  pt: pt.errors.ba,
  ja: ja.errors.ba,
  sv: sv.errors.ba,
  ko: ko.errors.ba,
};

export type BATranslationLocale = keyof typeof baErrorTranslations;
