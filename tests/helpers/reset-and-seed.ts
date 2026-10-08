import type { Payload } from "payload";
import pg from "pg";

import { seedContent } from "../../seed/content";
import { testWrite } from "./local-api";
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

/**
 * The fixtures every test run starts from: the shared seed content, the test
 * Editor, and the extra Articles that only tests need.
 */
export async function seedBase(payload: Payload): Promise<void> {
  await payload.create({
    collection: "users",
    data: {
      email: requiredEnv("TEST_EDITOR_EMAIL"),
      password: requiredEnv("TEST_EDITOR_PASSWORD"),
    },
    overrideAccess: true,
  });
  const { generalCategoryId, articlesCategoryId } = await seedContent(payload);

  await payload.create({
    collection: "articles",
    locale: "hr",
    data: {
      title: "Samo na hrvatskom",
      slug: "samo-hrvatski",
      category: generalCategoryId,
      publishedAt: "2026-01-15T00:00:00.000Z",
      _status: "published",
    },
    ...testWrite,
  });
  await seedArticleList(payload, articlesCategoryId);
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
