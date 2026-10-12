import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("payload.config.ts without its required secrets", () => {
  it.each(["PAYLOAD_SECRET", "DATABASE_URL"])("refuses to load with an empty %s", async (name) => {
    vi.resetModules();
    vi.stubEnv(name, "");

    await expect(import("@payload-config")).rejects.toThrow(new RegExp(name));
  });
});
