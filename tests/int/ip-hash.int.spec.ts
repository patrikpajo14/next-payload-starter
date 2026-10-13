import { describe, expect, it } from "vitest";

import { clientIp, hashIp } from "@/lib/ip-hash";

describe("hashIp", () => {
  it("returns a stable 64-character hex digest", () => {
    expect(hashIp("203.0.113.7", "salt")).toMatch(/^[0-9a-f]{64}$/);
    expect(hashIp("203.0.113.7", "salt")).toBe(hashIp("203.0.113.7", "salt"));
  });

  it("differs per salt and per address", () => {
    expect(hashIp("203.0.113.7", "a")).not.toBe(hashIp("203.0.113.7", "b"));
    expect(hashIp("203.0.113.7", "a")).not.toBe(hashIp("203.0.113.8", "a"));
  });

  it("does not contain the address", () => {
    expect(hashIp("203.0.113.7", "salt")).not.toContain("203");
  });
});

describe("clientIp", () => {
  it("takes the first address of x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": " 203.0.113.7 , 10.0.0.1" });

    expect(clientIp(headers)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip", () => {
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
  });

  it("is undefined when no proxy header is present", () => {
    expect(clientIp(new Headers())).toBeUndefined();
  });
});
