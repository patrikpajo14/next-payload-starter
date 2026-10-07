import type { Locale } from "./locales";

/**
 * Interface strings that belong to the application, not to Editors: the site
 * title, the not-found page, navigation labels, Article List pagination, and
 * the Products Slider's controls.
 * Everything else on the site comes from Payload.
 */
export interface Messages {
  siteTitle: string;
  notFoundTitle: string;
  notFoundBody: string;
  backToHome: string;
  mainNavigation: string;
  footerNavigation: string;
  languageSwitcher: string;
  /** Label of the Article List's page links. */
  pagination: string;
  /** Page title suffix for Article List page `n`. */
  pageNumber: (n: number) => string;
  /** Label of a Products Slider without a heading. */
  products: string;
  previousProduct: string;
  nextProduct: string;
}

export const messages: Record<Locale, Messages> = {
  hr: {
    siteTitle: "Starter Site",
    notFoundTitle: "Stranica nije pronađena",
    notFoundBody: "Stranica koju tražite ne postoji ili je premještena.",
    backToHome: "Natrag na početnu",
    mainNavigation: "Glavna navigacija",
    footerNavigation: "Poveznice u podnožju",
    languageSwitcher: "Odabir jezika",
    pagination: "Stranice",
    pageNumber: (n) => `stranica ${n}`,
    products: "Proizvodi",
    previousProduct: "Prethodni proizvod",
    nextProduct: "Sljedeći proizvod",
  },
  en: {
    siteTitle: "Starter Site",
    notFoundTitle: "Page not found",
    notFoundBody: "The page you are looking for does not exist or has moved.",
    backToHome: "Back to the homepage",
    mainNavigation: "Main navigation",
    footerNavigation: "Footer links",
    languageSwitcher: "Choose language",
    pagination: "Pages",
    pageNumber: (n) => `page ${n}`,
    products: "Products",
    previousProduct: "Previous product",
    nextProduct: "Next product",
  },
};
