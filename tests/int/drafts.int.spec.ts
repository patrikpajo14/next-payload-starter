import config from "@payload-config";
import { getPayload } from "payload";
import type { Payload } from "payload";
import { beforeAll, describe, expect, it } from "vitest";

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
