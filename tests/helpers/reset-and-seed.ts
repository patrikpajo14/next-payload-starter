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
}

export async function resetAndSeed(payload: Payload): Promise<void> {
  await resetDatabase(payload);
  await seedBase(payload);
}
