import { describe, expect, it } from "vitest";

import {
  assertSafeTestDatabase,
  endpointOf,
} from "../helpers/safe-database";

const TEST_URL = "postgresql://u:p@ep-test-branch-pooler.eu.neon.tech/neondb";
const DEV_URL = "postgresql://u:p@ep-dev-branch-pooler.eu.neon.tech/neondb";

const env = (overrides: Record<string, string | undefined> = {}) => ({
  TEST_DATABASE_URL: TEST_URL,
  DATABASE_URL: TEST_URL,
  ...overrides,
});

describe("assertSafeTestDatabase", () => {
  it("accepts a dedicated test database", () => {
    expect(() => assertSafeTestDatabase(env(), [DEV_URL])).not.toThrow();
  });

  it("refuses when TEST_DATABASE_URL is missing", () => {
    expect(() =>
      assertSafeTestDatabase(env({ TEST_DATABASE_URL: undefined }), []),
    ).toThrow(/TEST_DATABASE_URL is not set/);
  });

  it("refuses when the app is pointed at a different database", () => {
    expect(() =>
      assertSafeTestDatabase(env({ DATABASE_URL: DEV_URL }), []),
    ).toThrow(/must equal TEST_DATABASE_URL/);
  });

  it("refuses the same server as a protected env file, pooled or not", () => {
    const direct = "postgresql://u:p@ep-test-branch.eu.neon.tech/neondb";
    expect(() => assertSafeTestDatabase(env(), [direct])).toThrow(
      /dedicated test branch/,
    );
  });
});

describe("endpointOf", () => {
  it("strips the Neon pooler suffix and lower-cases the host", () => {
    expect(endpointOf(TEST_URL)).toBe("ep-test-branch.eu.neon.tech");
  });

  it("copes with quoted values and rejects garbage", () => {
    expect(endpointOf(`"${TEST_URL}"`)).toBe("ep-test-branch.eu.neon.tech");
    expect(endpointOf("not a url")).toBeUndefined();
  });
});
