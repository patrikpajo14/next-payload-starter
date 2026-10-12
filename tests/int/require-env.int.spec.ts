import { describe, expect, it } from "vitest";

import { requireEnv } from "@/lib/require-env";

describe("requireEnv", () => {
  it("returns the value when set", () => {
    expect(requireEnv("PAYLOAD_SECRET", { PAYLOAD_SECRET: "s3cret" })).toBe("s3cret");
  });

  it.each([undefined, "", "   "])("throws naming the variable for %j", (value) => {
    expect(() => requireEnv("DATABASE_URL", { DATABASE_URL: value })).toThrow(/DATABASE_URL/);
  });
});
