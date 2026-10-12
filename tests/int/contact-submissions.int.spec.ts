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

/** Stores one the way the server action does: access overridden. */
function seedSubmission() {
  return payload.create({ collection: "contact-submissions", data, overrideAccess: true });
}

describe("Contact Submissions with access control on", () => {
  it("denies a Visitor creating one", async () => {
    await expect(
      payload.create({ collection: "contact-submissions", data, overrideAccess: false }),
    ).rejects.toThrow();
  });

  it("stores one written with access overridden, with the Visitor's Locale", async () => {
    const created = await seedSubmission();

    expect(created.visitorLocale).toBe("hr");
  });

  it("denies a Visitor reading them", async () => {
    await expect(
      payload.find({ collection: "contact-submissions", overrideAccess: false }),
    ).rejects.toThrow();
  });

  it("denies a Visitor reading one by id", async () => {
    const created = await seedSubmission();

    await expect(
      payload.findByID({ collection: "contact-submissions", id: created.id, overrideAccess: false }),
    ).rejects.toThrow();
  });

  it("lets an Editor read them", async () => {
    await seedSubmission();
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
