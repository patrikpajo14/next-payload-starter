import config from "@payload-config";
import { getPayload } from "payload";
import { describe, expect, it } from "vitest";

describe("Local API smoke", () => {
  it("starts from the seeded Editor", async () => {
    const payload = await getPayload({ config });

    const { docs, totalDocs } = await payload.find({
      collection: "users",
      overrideAccess: true,
    });

    expect(totalDocs).toBe(1);
    expect(docs[0].email).toBe(process.env.TEST_EDITOR_EMAIL);
  });

  it("serves Croatian as the default content Locale", async () => {
    const payload = await getPayload({ config });

    expect(payload.config.localization).toMatchObject({
      defaultLocale: "hr",
      locales: [{ code: "hr" }, { code: "en" }],
    });
  });
});
