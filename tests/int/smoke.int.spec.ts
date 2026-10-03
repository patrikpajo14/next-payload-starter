import config from "@payload-config";
import { getPayload } from "payload";
import type { Payload } from "payload";
import { beforeAll, describe, expect, it } from "vitest";

let payload: Payload;

// Initialising Payload pulls the schema from the database, which can outlast a
// test's timeout; hooks get longer.
beforeAll(async () => {
  payload = await getPayload({ config });
});

describe("Local API smoke", () => {
  it("starts from the seeded Editor", async () => {
    const { docs, totalDocs } = await payload.find({
      collection: "users",
      overrideAccess: true,
    });

    expect(totalDocs).toBe(1);
    expect(docs[0].email).toBe(process.env.TEST_EDITOR_EMAIL);
  });

  it("serves Croatian as the default content Locale", () => {
    expect(payload.config.localization).toMatchObject({
      defaultLocale: "hr",
      locales: [{ code: "hr" }, { code: "en" }],
    });
  });
});
