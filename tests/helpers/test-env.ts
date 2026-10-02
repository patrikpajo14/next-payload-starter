import path from "node:path";
import { config as loadDotenv } from "dotenv";

import { assertSafeTestDatabase } from "./safe-database";

/** Secret for the app under test. Never the real one: it only signs test sessions. */
const TEST_PAYLOAD_SECRET = "test-only-secret-not-for-production";

/** Reads a variable the tests cannot run without. */
export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. See the test section of .env.example.`);
  }
  return value;
}

/**
 * Loads `.env.test` and points DATABASE_URL at the test database.
 *
 * Variables already present in the process (for example in CI) win over the
 * file. The returned values are what test processes need to run the app, since
 * `next build` and `next start` would otherwise read `.env.production`.
 */
export function loadTestEnv(cwd = process.cwd()): Record<string, string> {
  loadDotenv({ path: path.join(cwd, ".env.test"), quiet: true });

  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl) {
    throw new Error(
      "TEST_DATABASE_URL is not set. Copy the test section of .env.example to .env.test.",
    );
  }

  process.env.DATABASE_URL = testUrl;
  process.env.PAYLOAD_SECRET = process.env.TEST_PAYLOAD_SECRET ?? TEST_PAYLOAD_SECRET;
  assertSafeTestDatabase();

  return {
    DATABASE_URL: testUrl,
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
    TEST_DATABASE_URL: testUrl,
    TEST_EDITOR_EMAIL: process.env.TEST_EDITOR_EMAIL ?? "",
    TEST_EDITOR_PASSWORD: process.env.TEST_EDITOR_PASSWORD ?? "",
  };
}
