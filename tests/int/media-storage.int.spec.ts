import { describe, expect, it } from "vitest";

import { mediaStorage } from "../../lib/media-storage";

const r2 = {
  S3_BUCKET: "starter-media",
  S3_ENDPOINT: "https://account-id.r2.cloudflarestorage.com",
  S3_ACCESS_KEY_ID: "key",
  S3_SECRET_ACCESS_KEY: "secret",
};

describe("mediaStorage", () => {
  it("starts without any S3 variables (local disk)", () => {
    expect(() => mediaStorage({})).not.toThrow();
  });

  it("accepts a complete S3 configuration", () => {
    expect(() => mediaStorage(r2)).not.toThrow();
  });

  it("refuses a bucket without credentials instead of falling back to disk", () => {
    expect(() =>
      mediaStorage({ ...r2, S3_ACCESS_KEY_ID: undefined, S3_SECRET_ACCESS_KEY: "" }),
    ).toThrow("S3_BUCKET is set but S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY are not");
  });
});
