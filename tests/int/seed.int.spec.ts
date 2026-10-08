import config from "@payload-config";
import { getPayload } from "payload";
import type { Payload } from "payload";
import { beforeAll, describe, expect, it } from "vitest";

import { locales } from "@/lib/i18n/locales";

let payload: Payload;

beforeAll(async () => {
  payload = await getPayload({ config });
});

describe("seeded content", () => {
  it("has the first Editor", async () => {
    const { totalDocs } = await payload.count({ collection: "users", overrideAccess: true });
    expect(totalDocs).toBeGreaterThan(0);
  });

  it.each(locales)("has the Articles Category with an SEO Name in %s", async (locale) => {
    const { docs } = await payload.find({
      collection: "categories",
      locale,
      fallbackLocale: false,
      where: { seoName: { exists: true } },
      overrideAccess: true,
    });
    expect(docs.length).toBeGreaterThan(0);
    expect(docs[0].title).toBeTruthy();
  });

  it.each(locales)("has a nameless Category with the privacy policy and Contact Page in %s", async (locale) => {
    const { docs } = await payload.find({
      collection: "articles",
      locale,
      fallbackLocale: false,
      where: { _status: { equals: "published" } },
      depth: 1,
      limit: 100,
      overrideAccess: true,
    });
    const standalone = docs.filter(
      (a) => typeof a.category === "object" && !a.category.seoName,
    );
    expect(standalone.some((a) => a.showContactForm)).toBe(true);
    expect(standalone.some((a) => a.slug === (locale === "hr" ? "politika-privatnosti" : "privacy-policy"))).toBe(true);
  });

  it.each(locales)("has a Homepage with one of each Section in %s", async (locale) => {
    const homepage = await payload.findGlobal({
      slug: "homepage",
      locale,
      fallbackLocale: false,
      overrideAccess: true,
    });
    const types = (homepage.sections ?? []).map((s) => s.blockType);
    expect(types).toEqual(["hero", "productsSlider", "solutions", "faq", "banner"]);
  });
});
