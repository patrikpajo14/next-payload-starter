import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "dotenv";

/** Env files whose database URLs must never be the target of a test reset. */
const PROTECTED_ENV_FILES = [".env", ".env.development", ".env.production"];

/**
 * Neon serves the same compute endpoint through a pooled host
 * (`ep-name-pooler.…`) and a direct host (`ep-name.…`), so compare the
 * endpoint id without the pooler suffix.
 */
export function endpointOf(connectionString: string): string | undefined {
  try {
    const { hostname } = new URL(connectionString.replace(/^"|"$/g, ""));
    return hostname.replace(/-pooler(?=\.)/, "").toLowerCase();
  } catch {
    return undefined;
  }
}

/** Database URLs found in the dev and production env files of this repo. */
export function readProtectedUrls(cwd = process.cwd()): string[] {
  const urls: string[] = [];
  for (const file of PROTECTED_ENV_FILES) {
    const filePath = path.join(cwd, file);
    if (!existsSync(filePath)) continue;
    const parsed = parse(readFileSync(filePath));
    for (const value of Object.values(parsed)) {
      if (/^postgres(ql)?:\/\//.test(value)) urls.push(value);
    }
  }
  return urls;
}

/**
 * Throws unless the app under test is pointed at a dedicated test database.
 * Reset helpers call this first: they delete every document.
 */
export function assertSafeTestDatabase(
  env: Record<string, string | undefined> = process.env,
  protectedUrls: string[] = readProtectedUrls(),
): void {
  const testUrl = env.TEST_DATABASE_URL;
  if (!testUrl) {
    throw new Error(
      "TEST_DATABASE_URL is not set. Copy the test section of .env.example to .env.test.",
    );
  }
  if (env.DATABASE_URL !== testUrl) {
    throw new Error(
      "DATABASE_URL must equal TEST_DATABASE_URL while tests run; refusing to touch another database.",
    );
  }
  const testEndpoint = endpointOf(testUrl);
  if (!testEndpoint) {
    throw new Error("TEST_DATABASE_URL is not a valid connection string.");
  }
  const clash = protectedUrls.some((url) => endpointOf(url) === testEndpoint);
  if (clash) {
    throw new Error(
      "TEST_DATABASE_URL points at the same database server as .env, .env.development or .env.production. Use a dedicated test branch.",
    );
  }
}
