import type { Payload } from "payload";
import pg from "pg";
import sharp from "sharp";

import type { Locale } from "../../lib/i18n/locales";
import { testWrite } from "./local-api";
import { paragraphs } from "./rich-text";
import { assertSafeTestDatabase } from "./safe-database";
import { requiredEnv } from "./test-env";

/**
 * Drops and recreates the test database's `public` schema, so Payload pushes a
 * fresh schema on start. Run it before Payload initialises: a schema left over
 * from another branch's collections otherwise makes Payload's push stop at an
 * interactive data-loss prompt that no test runner answers.
 *
 * Refuses to run outside a dedicated test database.
 */
export async function resetDatabase(): Promise<void> {
  assertSafeTestDatabase();
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  } finally {
    await client.end();
  }
}

/** The fixtures every test run starts from. Later tickets add their own seeders here. */
export async function seedBase(payload: Payload): Promise<void> {
  await payload.create({
    collection: "users",
    data: {
      email: requiredEnv("TEST_EDITOR_EMAIL"),
      password: requiredEnv("TEST_EDITOR_PASSWORD"),
    },
    overrideAccess: true,
  });
  await seedSiteChrome(payload);
  const contactId = await seedStandaloneArticles(payload);
  const cover = await seedCategoryArticles(payload);
  await seedHomepage(payload, cover, contactId);
}

/** Header and Footer in both Locales. Written outside Next.js, so revalidation is skipped. */
async function seedSiteChrome(payload: Payload): Promise<void> {

  await payload.updateGlobal({
    slug: "header",
    locale: "hr",
    data: { navItems: [{ label: "Članci", url: "/hr/clanci" }] },
    ...testWrite,
  });
  await payload.updateGlobal({
    slug: "header",
    locale: "en",
    data: { navItems: [{ label: "Articles", url: "/en/articles" }] },
    ...testWrite,
  });

  await payload.updateGlobal({
    slug: "footer",
    locale: "hr",
    data: {
      text: "Starter Site, sva prava pridržana.",
      links: [{ label: "Politika privatnosti", url: "/hr/politika-privatnosti" }],
    },
    ...testWrite,
  });
  await payload.updateGlobal({
    slug: "footer",
    locale: "en",
    data: {
      text: "Starter Site, all rights reserved.",
      links: [{ label: "Privacy policy", url: "/en/privacy-policy" }],
    },
    ...testWrite,
  });
}

/**
 * A nameless Category with the privacy policy and the Contact Page in both
 * Locales and one Croatian-only Article. Returns the Contact Page's id.
 */
async function seedStandaloneArticles(payload: Payload): Promise<number> {
  const publishedAt = "2026-01-15T00:00:00.000Z";

  const general = await payload.create({
    collection: "categories",
    locale: "hr",
    data: { title: "Općenito" },
    ...testWrite,
  });
  await payload.update({
    collection: "categories",
    id: general.id,
    locale: "en",
    data: { title: "General" },
    ...testWrite,
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
    ...testWrite,
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
    ...testWrite,
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
    ...testWrite,
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
    ...testWrite,
  });

  await payload.create({
    collection: "articles",
    locale: "hr",
    data: {
      title: "Samo na hrvatskom",
      slug: "samo-hrvatski",
      category: general.id,
      publishedAt,
      _status: "published",
    },
    ...testWrite,
  });
  return contact.id;
}

/**
 * The Articles Category (`/hr/clanci`, `/en/articles`) with one published
 * Article and its cover image. Returns the cover image's id.
 */
async function seedCategoryArticles(payload: Payload): Promise<number> {
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
    ...testWrite,
  });
  await payload.update({
    collection: "categories",
    id: articlesCategory.id,
    locale: "en",
    data: { title: "Articles", seoName: "articles", intro: "News and stories from our team." },
    ...testWrite,
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
    ...testWrite,
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
    ...testWrite,
  });

  await seedArticleList(payload, articlesCategory.id);
  return image.id;
}

/**
 * Fills the Articles Category past one Article List page: "Članak 1" to
 * "Članak 10" (English "Article 1" to "Article 10"), one a day from 1 March
 * 2026, so "Članak 10" is the newest. With "Moj članak" (1 February) that is 11
 * Articles in each Locale, plus "Samo hrvatski članak" (20 January) in Croatian
 * only: 12 Croatian, 11 English, two list pages each.
 */
async function seedArticleList(payload: Payload, categoryId: number): Promise<void> {
  for (let n = 1; n <= 10; n++) {
    const article = await payload.create({
      collection: "articles",
      locale: "hr",
      data: {
        title: `Članak ${n}`,
        slug: `clanak-${n}`,
        category: categoryId,
        publishedAt: `2026-03-${String(n).padStart(2, "0")}T00:00:00.000Z`,
        _status: "published",
      },
      ...testWrite,
    });
    await payload.update({
      collection: "articles",
      id: article.id,
      locale: "en",
      data: { title: `Article ${n}`, slug: `article-${n}`, _status: "published" },
      ...testWrite,
    });
  }

  await payload.create({
    collection: "articles",
    locale: "hr",
    data: {
      title: "Samo hrvatski članak",
      slug: "samo-hrvatski-clanak",
      category: categoryId,
      publishedAt: "2026-01-20T00:00:00.000Z",
      _status: "published",
    },
    ...testWrite,
  });
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
    ...testWrite,
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
    ...testWrite,
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
    ...testWrite,
  });
  await payload.update({
    collection: "media",
    id: media.id,
    locale: "en",
    data: { alt: image.alt.en },
    ...testWrite,
  });
  return media;
}
