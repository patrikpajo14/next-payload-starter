import type { Payload } from "payload";
import sharp from "sharp";

import type { Locale } from "../lib/i18n/locales";
import { paragraphs } from "./rich-text";

/**
 * Options for Local API writes from seeds and tests: they bypass access
 * control, and skip revalidation, which only works inside a running Next.js server.
 */
const write = { overrideAccess: true, context: { disableRevalidate: true } } as const;

export interface SeededContent {
  /** The nameless Category holding the privacy policy and the Contact Page. */
  generalCategoryId: number;
  /** The Articles Category (`/hr/clanci`, `/en/articles`). */
  articlesCategoryId: number;
}

/**
 * The site's starting content in both Locales: Header, Footer, a nameless
 * Category with the privacy policy and the Contact Page, the Articles Category
 * with an Article, and a Homepage with one of each Section. The seed script and
 * the test database share it, so a fresh clone shows what the tests exercise.
 *
 * Not idempotent: run it on an empty database.
 */
export async function seedContent(payload: Payload): Promise<SeededContent> {
  await seedSiteChrome(payload);
  const { generalId, contactId } = await seedStandaloneArticles(payload);
  const { coverId, articlesId } = await seedCategoryArticles(payload);
  await seedHomepage(payload, coverId, contactId);
  return { generalCategoryId: generalId, articlesCategoryId: articlesId };
}

/** Header and Footer in both Locales. Written outside Next.js, so revalidation is skipped. */
async function seedSiteChrome(payload: Payload): Promise<void> {
  await payload.updateGlobal({
    slug: "header",
    locale: "hr",
    data: { navItems: [{ label: "Članci", url: "/hr/clanci" }] },
    ...write,
  });
  await payload.updateGlobal({
    slug: "header",
    locale: "en",
    data: { navItems: [{ label: "Articles", url: "/en/articles" }] },
    ...write,
  });

  await payload.updateGlobal({
    slug: "footer",
    locale: "hr",
    data: {
      text: "Starter Site, sva prava pridržana.",
      links: [{ label: "Politika privatnosti", url: "/hr/politika-privatnosti" }],
    },
    ...write,
  });
  await payload.updateGlobal({
    slug: "footer",
    locale: "en",
    data: {
      text: "Starter Site, all rights reserved.",
      links: [{ label: "Privacy policy", url: "/en/privacy-policy" }],
    },
    ...write,
  });
}

/**
 * A nameless Category with the privacy policy and the Contact Page in both
 * Locales. Returns the Category's and the Contact Page's ids.
 */
async function seedStandaloneArticles(payload: Payload): Promise<{ generalId: number; contactId: number }> {
  const publishedAt = "2026-01-15T00:00:00.000Z";

  const general = await payload.create({
    collection: "categories",
    locale: "hr",
    data: { title: "Općenito" },
    ...write,
  });
  await payload.update({
    collection: "categories",
    id: general.id,
    locale: "en",
    data: { title: "General" },
    ...write,
  });

  const privacy = await payload.create({
    collection: "articles",
    locale: "hr",
    data: {
      title: "Politika privatnosti",
      slug: "politika-privatnosti",
      body: paragraphs("Vaši podaci su sigurni."),
      category: general.id,
      publishedAt,
      _status: "published",
    },
    ...write,
  });
  await payload.update({
    collection: "articles",
    id: privacy.id,
    locale: "en",
    data: {
      title: "Privacy policy",
      slug: "privacy-policy",
      body: paragraphs("Your data is safe."),
      _status: "published",
    },
    ...write,
  });

  const contact = await payload.create({
    collection: "articles",
    locale: "hr",
    data: {
      title: "Kontakt",
      slug: "kontakt",
      body: paragraphs("Javite nam se."),
      category: general.id,
      showContactForm: true,
      privacyPolicy: privacy.id,
      publishedAt,
      _status: "published",
    },
    ...write,
  });
  await payload.update({
    collection: "articles",
    id: contact.id,
    locale: "en",
    data: {
      title: "Contact",
      slug: "contact",
      body: paragraphs("Get in touch."),
      _status: "published",
    },
    ...write,
  });

  return { generalId: general.id, contactId: contact.id };
}

/**
 * The Articles Category (`/hr/clanci`, `/en/articles`) with one published
 * Article and its cover image. Returns the image's and the Category's ids.
 */
async function seedCategoryArticles(payload: Payload): Promise<{ coverId: number; articlesId: number }> {
  const image = await seedImage(payload, {
    name: "naslovnica.png",
    width: 1200,
    height: 630,
    background: "#1d4ed8",
    alt: { hr: "Plava naslovnica", en: "Blue cover" },
  });

  const articlesCategory = await payload.create({
    collection: "categories",
    locale: "hr",
    data: { title: "Članci", seoName: "clanci", intro: "Novosti i priče našeg tima." },
    ...write,
  });
  await payload.update({
    collection: "categories",
    id: articlesCategory.id,
    locale: "en",
    data: { title: "Articles", seoName: "articles", intro: "News and stories from our team." },
    ...write,
  });

  const article = await payload.create({
    collection: "articles",
    locale: "hr",
    data: {
      title: "Moj članak",
      slug: "moj-clanak",
      body: paragraphs("Tekst mog članka."),
      category: articlesCategory.id,
      coverImage: image.id,
      publishedAt: "2026-02-01T00:00:00.000Z",
      _status: "published",
    },
    ...write,
  });
  await payload.update({
    collection: "articles",
    id: article.id,
    locale: "en",
    data: {
      title: "My article",
      slug: "my-article",
      body: paragraphs("The text of my article."),
      _status: "published",
    },
    ...write,
  });

  return { coverId: image.id, articlesId: articlesCategory.id };
}

/**
 * One of each Section per Locale, in this order: a Hero with the blue cover
 * image, a Products Slider of three products, a Solutions Section of two
 * solutions, a FAQ of two questions, and a Banner whose CTA leads to the Contact
 * Page. The first product and solution have a green image, and the second a
 * link. The Banner has the green image too.
 */
async function seedHomepage(payload: Payload, coverId: number, contactId: number): Promise<void> {
  const greenImage = await seedImage(payload, {
    name: "zelena.png",
    width: 800,
    height: 600,
    background: "#15803d",
    alt: { hr: "Zelena slika", en: "Green image" },
  });

  await payload.updateGlobal({
    slug: "homepage",
    locale: "hr",
    data: {
      sections: [
        {
          blockType: "hero",
          image: coverId,
          heading: "Dobrodošli na Starter Site",
          text: "Članci i novosti našeg tima.",
        },
        {
          blockType: "productsSlider",
          heading: "Naši proizvodi",
          items: [
            { title: "Proizvod Jedan", text: "Prvi proizvod u ponudi.", image: greenImage.id },
            {
              title: "Proizvod Dva",
              text: "Drugi proizvod u ponudi.",
              link: { label: "Saznajte više", url: "/hr/clanci" },
            },
            { title: "Proizvod Tri", text: "Treći proizvod u ponudi." },
          ],
        },
        {
          blockType: "solutions",
          heading: "Naša rješenja",
          items: [
            { title: "Rješenje A", text: "Za mala poduzeća.", image: greenImage.id },
            {
              title: "Rješenje B",
              text: "Za velike timove.",
              link: { label: "Pročitajte članke", url: "/hr/clanci" },
            },
          ],
        },
        {
          blockType: "faq",
          heading: "Česta pitanja",
          items: [
            { question: "Što je Starter Site?", answer: "Početni predložak web-stranice." },
            { question: "Tko uređuje sadržaj?", answer: "Urednici u administraciji." },
          ],
        },
        {
          blockType: "banner",
          image: greenImage.id,
          text: "Imate pitanje? Javite nam se.",
          cta: { label: "Kontaktirajte nas", article: contactId },
        },
      ],
    },
    ...write,
  });
  await payload.updateGlobal({
    slug: "homepage",
    locale: "en",
    data: {
      sections: [
        {
          blockType: "hero",
          image: coverId,
          heading: "Welcome to Starter Site",
          text: "Articles and news from our team.",
        },
        {
          blockType: "productsSlider",
          heading: "Our products",
          items: [
            { title: "Product One", text: "The first product on offer.", image: greenImage.id },
            {
              title: "Product Two",
              text: "The second product on offer.",
              link: { label: "Learn more", url: "/en/articles" },
            },
            { title: "Product Three", text: "The third product on offer." },
          ],
        },
        {
          blockType: "solutions",
          heading: "Our solutions",
          items: [
            { title: "Solution A", text: "For small businesses.", image: greenImage.id },
            {
              title: "Solution B",
              text: "For large teams.",
              link: { label: "Read our articles", url: "/en/articles" },
            },
          ],
        },
        {
          blockType: "faq",
          heading: "Frequently asked questions",
          items: [
            { question: "What is Starter Site?", answer: "A starter template for websites." },
            { question: "Who edits the content?", answer: "Editors in the admin." },
          ],
        },
        {
          blockType: "banner",
          image: greenImage.id,
          text: "Have a question? Get in touch.",
          cta: { label: "Contact us", article: contactId },
        },
      ],
    },
    ...write,
  });
}

/** A single-colour PNG with its alt text in both Locales. */
async function seedImage(
  payload: Payload,
  image: {
    name: string;
    width: number;
    height: number;
    background: string;
    alt: Record<Locale, string>;
  },
) {
  const data = await sharp({
    create: { width: image.width, height: image.height, channels: 3, background: image.background },
  })
    .png()
    .toBuffer();
  const media = await payload.create({
    collection: "media",
    locale: "hr",
    data: { alt: image.alt.hr },
    file: { data, mimetype: "image/png", name: image.name, size: data.length },
    ...write,
  });
  await payload.update({
    collection: "media",
    id: media.id,
    locale: "en",
    data: { alt: image.alt.en },
    ...write,
  });
  return media;
}

/**
 * Three more Articles in the Articles Category, so a fresh site has a list worth
 * reading. Only the seed script adds them: tests rely on exact Article counts.
 */
export async function seedSampleArticles(payload: Payload, categoryId: number): Promise<void> {
  const samples: { hr: [string, string, string]; en: [string, string, string]; publishedAt: string }[] = [
    {
      hr: ["Pokrenuli smo novu web-stranicu", "nova-web-stranica", "Sav sadržaj uređuje se na jednom mjestu."],
      en: ["We launched our new website", "new-website", "All content is edited in one place."],
      publishedAt: "2026-09-28T09:00:00.000Z",
    },
    {
      hr: ["Naš tim raste", "tim-raste", "Ove smo jeseni dočekali pet novih kolega."],
      en: ["Our team is growing", "team-is-growing", "This autumn we welcomed five new colleagues."],
      publishedAt: "2026-09-14T09:00:00.000Z",
    },
    {
      hr: ["Kako odabrati pravo rješenje", "odabir-rjesenja", "Zapišite što želite postići, pa usporedite dvije ili tri opcije."],
      en: ["How to choose the right solution", "choosing-a-solution", "Write down what you want to achieve, then compare two or three options."],
      publishedAt: "2026-09-07T09:00:00.000Z",
    },
  ];
  for (const sample of samples) {
    const [titleHr, slugHr, bodyHr] = sample.hr;
    const [titleEn, slugEn, bodyEn] = sample.en;
    const article = await payload.create({
      collection: "articles",
      locale: "hr",
      data: {
        title: titleHr,
        slug: slugHr,
        body: paragraphs(bodyHr),
        category: categoryId,
        publishedAt: sample.publishedAt,
        _status: "published",
      },
      ...write,
    });
    await payload.update({
      collection: "articles",
      id: article.id,
      locale: "en",
      data: { title: titleEn, slug: slugEn, body: paragraphs(bodyEn), _status: "published" },
      ...write,
    });
  }
}
