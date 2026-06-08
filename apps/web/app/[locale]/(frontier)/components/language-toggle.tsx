import { LanguageToggle as LanguageToggleBase } from "@repo/design-system/components/molecules/header/language-toggle";
import { DEFAULT_LOCALE, locales } from "@repo/internationalization/shared";

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  es: "Español",
  de: "Deutsch",
  zh: "中文",
  fr: "Français",
  pt: "Português",
  ja: "日本語",
  sv: "Svenska",
  ko: "한국어",
};

const languages = locales.map((value) => ({
  value,
  label: LOCALE_LABELS[value] ?? value,
}));

export function LanguageToggle({ className }: { className?: string }) {
  return (
    <LanguageToggleBase
      className={className}
      defaultLocale={DEFAULT_LOCALE}
      languages={languages}
    />
  );
}
