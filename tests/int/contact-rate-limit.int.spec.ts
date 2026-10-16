import config from "@payload-config";
import { getPayload } from "payload";
import type { Payload } from "payload";
import { beforeAll, describe, expect, it } from "vitest";

import { CONTACT_RATE_LIMIT, isContactRateLimited } from "@/lib/contact-rate-limit";

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

/** A hash no other test uses, so counts start at zero. */
const uniqueHash = () => `rate-limit-${crypto.randomUUID()}`;

/** Stores Contact Submissions the way the server action does: access overridden. */
async function seed(ipHash: string, count: number) {
  for (let i = 0; i < count; i++) {
    await payload.create({
      collection: "contact-submissions",
      data: { ...data, ipHash },
      overrideAccess: true,
    });
  }
}

describe("isContactRateLimited", () => {
  it("allows a Visitor with fewer than the limit of Contact Submissions in the last hour", async () => {
    const ipHash = uniqueHash();
    await seed(ipHash, CONTACT_RATE_LIMIT - 1);

    expect(await isContactRateLimited(payload, ipHash)).toBe(false);
  });

  it("reports a Visitor with five Contact Submissions in the last hour as limited", async () => {
    const ipHash = uniqueHash();
    await seed(ipHash, CONTACT_RATE_LIMIT);

    expect(CONTACT_RATE_LIMIT).toBe(5);
    expect(await isContactRateLimited(payload, ipHash)).toBe(true);
  });

  it("does not count another Visitor's Contact Submissions", async () => {
    await seed(uniqueHash(), CONTACT_RATE_LIMIT);

    expect(await isContactRateLimited(payload, uniqueHash())).toBe(false);
  });

  it("does not count Contact Submissions older than an hour", async () => {
    const ipHash = uniqueHash();
    await seed(ipHash, CONTACT_RATE_LIMIT);
    const twoHoursLater = new Date(Date.now() + 2 * 60 * 60 * 1000);

    expect(await isContactRateLimited(payload, ipHash, twoHoursLater)).toBe(false);
  });
});
