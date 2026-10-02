import { localeLabels, locales } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";

/**
 * Links straight to each Locale's Homepage. Linking to `/hr` or `/en` (not `/`)
 * keeps the proxy from sending the Visitor back by browser language, and the
 * Homepage always exists in both Locales.
 */
export function LanguageSwitcher({ current, label }: { current: Locale; label: string }) {
  return (
    <nav aria-label={label}>
      <ul className="flex gap-3 text-sm">
        {locales.map((locale) => (
          <li key={locale}>
            {/* A plain anchor: a full load re-renders the root layout with the new `lang`. */}
            <a
              href={`/${locale}`}
              hrefLang={locale}
              lang={locale}
              aria-current={locale === current ? "true" : undefined}
              className={locale === current ? "font-semibold" : "underline"}
            >
              {localeLabels[locale]}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
