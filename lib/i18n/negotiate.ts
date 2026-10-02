import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

import { defaultLocale, locales } from "./locales";
import type { Locale } from "./locales";

/** Picks the Locale a browser prefers, or the default when none is supported. */
export function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const requested = new Negotiator({
    headers: { "accept-language": acceptLanguage },
  }).languages();

  try {
    return match(requested, locales, defaultLocale) as Locale;
  } catch {
    // The matcher throws on malformed language tags.
    return defaultLocale;
  }
}
