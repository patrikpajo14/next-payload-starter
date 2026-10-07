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
  contact: ContactMessages;
}

/** Contact Form labels, hints, and validation errors. Plain strings, so they pass to Client Components. */
export interface ContactMessages {
  firstName: string;
  lastName: string;
  email: string;
  emailOptional: string;
  phone: string;
  address: string;
  postalCode: string;
  message: string;
  /** Text before the privacy policy link in the consent checkbox label. */
  consentBefore: string;
  /** Consent label when the Article names no privacy policy to link. */
  consentPlain: string;
  submit: string;
  sending: string;
  success: string;
  failure: string;
  errors: {
    required: string;
    email: string;
    phone: string;
    postalCode: string;
  };
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
    contact: {
      firstName: "Ime",
      lastName: "Prezime",
      email: "E-pošta",
      emailOptional: "(neobavezno)",
      phone: "Telefon",
      address: "Adresa",
      postalCode: "Poštanski broj",
      message: "Poruka",
      consentBefore: "Pročitao/la sam i prihvaćam",
      consentPlain: "Prihvaćam obradu osobnih podataka",
      submit: "Pošalji",
      sending: "Slanje…",
      success: "Hvala! Vaša je poruka poslana.",
      failure: "Poruka nije poslana. Pokušajte ponovno.",
      errors: {
        required: "Ovo polje je obavezno.",
        email: "Unesite ispravnu adresu e-pošte.",
        phone: "Koristite samo znamenke, razmake, + i -.",
        postalCode: "Unesite peteroznamenkasti poštanski broj.",
      },
    },
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
    contact: {
      firstName: "First name",
      lastName: "Last name",
      email: "Email",
      emailOptional: "(optional)",
      phone: "Phone",
      address: "Address",
      postalCode: "Postal code",
      message: "Message",
      consentBefore: "I have read and accept the",
      consentPlain: "I agree to the processing of my personal data",
      submit: "Send",
      sending: "Sending…",
      success: "Thank you! Your message has been sent.",
      failure: "Your message was not sent. Please try again.",
      errors: {
        required: "This field is required.",
        email: "Enter a valid email address.",
        phone: "Use only digits, spaces, + and -.",
        postalCode: "Enter a five-digit postal code.",
      },
    },
  },
};
