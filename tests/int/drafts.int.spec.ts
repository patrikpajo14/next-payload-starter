import config from "@payload-config";
import { getPayload } from "payload";
import type { Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { testWrite } from "../helpers/local-api";
import { paragraphs } from "../helpers/rich-text";

let payload: Payload;
let categoryId: number;

beforeAll(async () => {
  payload = await getPayload({ config });
  categoryId = (
    await payload.create({
      collection: "categories",
      locale: "hr",
      data: { title: "Nacrti", seoName: `nacrti-${Date.now()}` },
      ...testWrite,
    })
  ).id;
});

/** Creates an Article in the test Category with the given status. */
const createArticle = (slug: string, title: string, status: "draft" | "published") =>
  payload.create({
    collection: "articles",
    locale: "hr",
    data: {
      title,
      slug,
      category: categoryId,
      body: paragraphs(title),
      publishedAt: new Date().toISOString(),
      _status: status,
    },
    ...testWrite,
  });

/** What a Visitor's query returns: access control on, no user. */
const visitorFind = (slug: string) =>
  payload.find({
    collection: "articles",
    locale: "hr",
    where: { slug: { equals: slug } },
    overrideAccess: false,
  });

describe("Drafts with access control on", () => {
  it("keeps a Draft out of a Visitor's query", async () => {
    await createArticle("tajni-nacrt", "Tajni nacrt", "draft");

    expect((await visitorFind("tajni-nacrt")).docs).toHaveLength(0);
  });

  it("keeps a Draft out even when the query asks for drafts", async () => {
    await createArticle("trazeni-nacrt", "Traženi nacrt", "draft");

    const { docs } = await payload.find({
      collection: "articles",
      locale: "hr",
      where: { slug: { equals: "trazeni-nacrt" } },
      draft: true,
      overrideAccess: false,
    });
    expect(docs).toHaveLength(0);
  });

  it("refuses a Draft by id", async () => {
    const draft = await createArticle("nacrt-po-id", "Nacrt po id", "draft");

    await expect(
      payload.findByID({ collection: "articles", id: draft.id, overrideAccess: false }),
    ).rejects.toThrow();
  });

  it("shows a published Article", async () => {
    await createArticle("objavljeno", "Objavljeno", "published");

    expect((await visitorFind("objavljeno")).docs).toHaveLength(1);
  });

  it("keeps showing the published version while a newer Draft is being edited", async () => {
    const published = await createArticle("u-izradi", "Objavljeni naslov", "published");
    await payload.update({
      collection: "articles",
      id: published.id,
      locale: "hr",
      data: { title: "Neobjavljeni naslov" },
      draft: true,
      ...testWrite,
    });

    const { docs } = await visitorFind("u-izradi");
    expect(docs.map((doc) => doc.title)).toEqual(["Objavljeni naslov"]);
  });
});

describe("Featured Article", () => {
  it("is off by default", async () => {
    const article = await createArticle(`plain-${Date.now()}`, "Obican", "published");

    expect(article.featured).toBe(false);
  });

  it("is the same in every Locale", async () => {
    const article = await createArticle(`feat-${Date.now()}`, "Istaknut", "published");
    await payload.update({
      collection: "articles",
      id: article.id,
      locale: "en",
      data: { title: "Featured", slug: `featured-${Date.now()}`, featured: true },
      ...testWrite,
    });

    const hr = await payload.findByID({ collection: "articles", id: article.id, locale: "hr" });
    expect(hr.featured).toBe(true);
  });
});

describe("Homepage Drafts", () => {
  const sections = (heading: string) => [{ blockType: "hero" as const, heading }];
  let seeded: Awaited<ReturnType<typeof readHomepage>>;

  const readHomepage = () =>
    payload.findGlobal({
      slug: "homepage",
      locale: "hr",
      fallbackLocale: false,
      draft: true,
      overrideAccess: true,
    });

  // The seeded Homepage is shared with later test files: put it back.
  beforeAll(async () => {
    seeded = await readHomepage();
  });
  afterAll(async () => {
    await payload.updateGlobal({
      slug: "homepage",
      locale: "hr",
      data: { sections: seeded.sections, _status: "published" },
      ...testWrite,
    });
  });

  it("keeps a saved Draft out of a Visitor's read and shows it to an Editor", async () => {
    await payload.updateGlobal({
      slug: "homepage",
      locale: "hr",
      data: { sections: sections("Objavljeno"), _status: "published" },
      ...testWrite,
    });
    await payload.updateGlobal({
      slug: "homepage",
      locale: "hr",
      data: { sections: sections("Nacrt") },
      draft: true,
      ...testWrite,
    });

    const visitor = await payload.findGlobal({
      slug: "homepage",
      locale: "hr",
      overrideAccess: false,
    });
    const editor = await payload.findGlobal({
      slug: "homepage",
      locale: "hr",
      draft: true,
      overrideAccess: true,
    });

    expect(visitor.sections?.[0]).toMatchObject({ heading: "Objavljeno" });
    expect(editor.sections?.[0]).toMatchObject({ heading: "Nacrt" });
  });

  it("is not returned to a Visitor who asks for drafts", async () => {
    const visitor = await payload.findGlobal({
      slug: "homepage",
      locale: "hr",
      draft: true,
      overrideAccess: false,
    });

    expect(visitor.sections?.[0]).toMatchObject({ heading: "Objavljeno" });
  });

  it("has Live Preview pointing at the Locale's Homepage", async () => {
    const homepage = payload.config.globals.find((g) => g.slug === "homepage");
    const livePreview = homepage?.admin?.livePreview;
    const url = livePreview && "url" in livePreview ? livePreview.url : undefined;

    expect(typeof url).toBe("function");
    if (typeof url !== "function") return;
    const args = { locale: { code: "en" } } as unknown as Parameters<typeof url>[0];
    expect(await url(args)).toBe("/en");
  });
});
