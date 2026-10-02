import type { Locale } from "./locales";

/**
 * Interface strings that belong to the application, not to Editors: the shell
 * and not-found page. Everything else on the site comes from Payload.
 */
export interface Messages {
  siteTitle: string;
  welcome: string;
  shellIntro: string;
  notFoundTitle: string;
  notFoundBody: string;
  backToHome: string;
}

export const messages: Record<Locale, Messages> = {
  hr: {
    siteTitle: "Starter Site",
    welcome: "Dobrodošli",
    shellIntro: "Ovdje će uskoro biti sadržaj.",
    notFoundTitle: "Stranica nije pronađena",
    notFoundBody: "Stranica koju tražite ne postoji ili je premještena.",
    backToHome: "Natrag na početnu",
  },
  en: {
    siteTitle: "Starter Site",
    welcome: "Welcome",
    shellIntro: "Content will appear here soon.",
    notFoundTitle: "Page not found",
    notFoundBody: "The page you are looking for does not exist or has moved.",
    backToHome: "Back to the homepage",
  },
};
