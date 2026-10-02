/** The single source of truth for supported content Locales. */
export const locales = ["hr", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "hr";

/** Names shown to Editors in the admin Locale selector. */
export const localeLabels: Record<Locale, string> = {
  hr: "Hrvatski",
  en: "English",
};

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
