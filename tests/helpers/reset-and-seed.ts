import type { Payload } from "payload";
import pg from "pg";
import sharp from "sharp";

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
  await seedStandaloneArticles(payload);
  await seedCategoryArticles(payload);
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

/** A nameless Category with the privacy policy in both Locales and one Croatian-only Article. */
async function seedStandaloneArticles(payload: Payload): Promise<void> {
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
}

/** The Articles Category (`/hr/clanci`, `/en/articles`) with one published Article and its cover image. */
async function seedCategoryArticles(payload: Payload): Promise<void> {
  const cover = await sharp({
    create: { width: 1200, height: 630, channels: 3, background: "#1d4ed8" },
  })
    .png()
    .toBuffer();
  const image = await payload.create({
    collection: "media",
    locale: "hr",
    data: { alt: "Plava naslovnica" },
    file: { data: cover, mimetype: "image/png", name: "naslovnica.png", size: cover.length },
    ...testWrite,
  });
  await payload.update({
    collection: "media",
    id: image.id,
    locale: "en",
    data: { alt: "Blue cover" },
    ...testWrite,
  });

  const articlesCategory = await payload.create({
    collection: "categories",
    locale: "hr",
    data: { title: "Članci", seoName: "clanci" },
    ...testWrite,
  });
  await payload.update({
    collection: "categories",
    id: articlesCategory.id,
    locale: "en",
    data: { title: "Articles", seoName: "articles" },
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
}
