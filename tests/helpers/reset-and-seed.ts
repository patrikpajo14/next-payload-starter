import type { Payload } from "payload";
import pg from "pg";

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
}

/** Header and Footer in both Locales. Written outside Next.js, so revalidation is skipped. */
async function seedSiteChrome(payload: Payload): Promise<void> {
  const options = { overrideAccess: true, context: { disableRevalidate: true } };

  await payload.updateGlobal({
    slug: "header",
    locale: "hr",
    data: { navItems: [{ label: "Članci", url: "/hr/clanci" }] },
    ...options,
  });
  await payload.updateGlobal({
    slug: "header",
    locale: "en",
    data: { navItems: [{ label: "Articles", url: "/en/articles" }] },
    ...options,
  });

  await payload.updateGlobal({
    slug: "footer",
    locale: "hr",
    data: {
      text: "Starter Site, sva prava pridržana.",
      links: [{ label: "Politika privatnosti", url: "/hr/politika-privatnosti" }],
    },
    ...options,
  });
  await payload.updateGlobal({
    slug: "footer",
    locale: "en",
    data: {
      text: "Starter Site, all rights reserved.",
      links: [{ label: "Privacy policy", url: "/en/privacy-policy" }],
    },
    ...options,
  });
}
