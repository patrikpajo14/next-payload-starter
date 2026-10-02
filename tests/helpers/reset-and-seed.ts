import type { CollectionSlug, Payload } from "payload";

import { assertSafeTestDatabase } from "./safe-database";
import { requiredEnv } from "./test-env";

/** Deletes every document in every collection. Refuses to run outside a test database. */
export async function resetDatabase(payload: Payload): Promise<void> {
  assertSafeTestDatabase();
  for (const { slug } of payload.config.collections) {
    await payload.delete({
      collection: slug as CollectionSlug,
      where: { id: { exists: true } },
      overrideAccess: true,
    });
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

export async function resetAndSeed(payload: Payload): Promise<void> {
  await resetDatabase(payload);
  await seedBase(payload);
}
