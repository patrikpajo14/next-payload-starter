import config from "@payload-config";
import { getPayload } from "payload";
import type { Payload } from "payload";
import { beforeAll, describe, expect, it } from "vitest";

let payload: Payload;

beforeAll(async () => {
  payload = await getPayload({ config });
});

const data = {
  firstName: "Ana",
  lastName: "Horvat",
  phone: "091 234 5678",
  address: "Ilica 1",
  postalCode: "10000",
  message: "Pozdrav!",
  visitorLocale: "hr",
} as const;

describe("Contact Submissions with access control on", () => {
  it("lets a Visitor create one, with their Locale", async () => {
    const created = await payload.create({
      collection: "contact-submissions",
      data,
      overrideAccess: false,
    });

    expect(created.visitorLocale).toBe("hr");
  });

  it("denies a Visitor reading them", async () => {
    await expect(
      payload.find({ collection: "contact-submissions", overrideAccess: false }),
    ).rejects.toThrow();
  });

  it("denies a Visitor reading one by id", async () => {
    const created = await payload.create({
      collection: "contact-submissions",
      data,
      overrideAccess: false,
    });

    await expect(
      payload.findByID({ collection: "contact-submissions", id: created.id, overrideAccess: false }),
    ).rejects.toThrow();
  });

  it("lets an Editor read them", async () => {
    // The seeded Editor: creating another user would break tests that count them.
    const {
      docs: [user],
    } = await payload.find({ collection: "users", overrideAccess: true });

    const { docs } = await payload.find({
      collection: "contact-submissions",
      user: { ...user, collection: "users" },
      overrideAccess: false,
    });

    expect(docs.length).toBeGreaterThan(0);
  });
});
