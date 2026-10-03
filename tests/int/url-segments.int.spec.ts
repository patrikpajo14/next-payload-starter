import config from "@payload-config";
import { getPayload, ValidationError } from "payload";
import type { Payload } from "payload";
import { beforeAll, describe, expect, it } from "vitest";

import type { Locale } from "../../lib/i18n/locales";
import { pageNumber } from "../../lib/url-segments";
import { testWrite } from "../helpers/local-api";
import { paragraphs } from "../helpers/rich-text";

let payload: Payload;


beforeAll(async () => {
  payload = await getPayload({ config });
});

/** The validation message Payload reports for one field, or undefined when the write succeeds. */
async function rejection(write: Promise<unknown>, field: string) {
  try {
    await write;
    return undefined;
  } catch (error) {
    if (!(error instanceof ValidationError)) throw error;
    return error.data.errors.find((e) => e.path === field)?.message;
  }
}

const createCategory = (locale: Locale, data: { title: string; seoName?: string }) =>
  payload.create({ collection: "categories", locale, data, ...testWrite });

const createArticle = (
  locale: Locale,
  data: { title: string; slug: string; category: number; publishedAt?: string },
) =>
  payload.create({
    collection: "articles",
    locale,
    data: { publishedAt: new Date().toISOString(), ...data, body: paragraphs(data.title) },
    ...testWrite,
  });

/** Each test gets its own nameless Category so slugs never clash across tests. */
const namelessCategory = async () =>
  (await createCategory("hr", { title: `Bez naziva ${crypto.randomUUID()}` })).id;

const updateCategory = (
  id: number,
  locale: Locale,
  data: { title?: string; seoName: string | null },
) =>
  payload.update({ collection: "categories", id, locale, data, ...testWrite });

describe("Category SEO Names", () => {
  it.each(["2024", "admin", "api"])("rejects the reserved or numeric value %s", async (value) => {
    const message = await rejection(createCategory("hr", { title: "Kat", seoName: value }), "seoName");

    expect(message).toBeDefined();
  });

  it.each(["Velika-Slova", "s razmakom", "kraj-", "č-ž"])(
    "rejects %s, which is not a lowercase URL segment",
    async (value) => {
      expect(
        await rejection(createCategory("hr", { title: "Kat", seoName: value }), "seoName"),
      ).toBeDefined();
    },
  );

  it("rejects an SEO Name another Category uses in the same Locale", async () => {
    await createCategory("hr", { title: "Novosti", seoName: "novosti" });

    expect(
      await rejection(createCategory("hr", { title: "Vijesti", seoName: "novosti" }), "seoName"),
    ).toBeDefined();
  });

  it("allows the same SEO Name in another Locale", async () => {
    await createCategory("hr", { title: "Blog", seoName: "blog" });

    expect(await rejection(createCategory("en", { title: "Blog", seoName: "blog" }), "seoName"))
      .toBeUndefined();
  });

  it("allows a Category to keep its own SEO Name when saved again", async () => {
    const category = await createCategory("hr", { title: "Usluge", seoName: "usluge" });

    const update = payload.update({
      collection: "categories",
      id: category.id,
      locale: "hr",
      data: { title: "Naše usluge" },
      ...testWrite,
    });

    expect(await rejection(update, "seoName")).toBeUndefined();
  });

  it("rejects an SEO Name a Standalone Article uses as its slug in the same Locale", async () => {
    await createArticle("hr", { title: "Uvjeti", slug: "uvjeti", category: await namelessCategory() });

    expect(
      await rejection(createCategory("hr", { title: "Uvjeti", seoName: "uvjeti" }), "seoName"),
    ).toBeDefined();
  });
});

describe("Standalone Article slugs", () => {
  it.each(["42", "admin", "api"])("rejects the reserved or numeric value %s", async (value) => {
    const category = await namelessCategory();

    expect(await rejection(createArticle("hr", { title: "X", slug: value, category }), "slug"))
      .toBeDefined();
  });

  it("rejects a slug another Standalone Article uses in the same Locale", async () => {
    const category = await namelessCategory();
    await createArticle("hr", { title: "Impresum", slug: "impresum", category });

    expect(
      await rejection(
        createArticle("hr", { title: "Impresum 2", slug: "impresum", category: await namelessCategory() }),
        "slug",
      ),
    ).toBeDefined();
  });

  it("rejects a slug a Category uses as its SEO Name in the same Locale", async () => {
    await createCategory("hr", { title: "Projekti", seoName: "projekti" });

    expect(
      await rejection(
        createArticle("hr", { title: "Projekti", slug: "projekti", category: await namelessCategory() }),
        "slug",
      ),
    ).toBeDefined();
  });

  it("allows the same slug in another Locale", async () => {
    await createArticle("hr", { title: "Kolačići", slug: "cookies", category: await namelessCategory() });

    expect(
      await rejection(
        createArticle("en", { title: "Cookies", slug: "cookies", category: await namelessCategory() }),
        "slug",
      ),
    ).toBeUndefined();
  });
});

describe("changes that move Articles in or out of the shared namespace", () => {
  it("rejects removing an SEO Name when the Category's Articles would collide", async () => {
    await createArticle("hr", { title: "Cjenik", slug: "cjenik", category: await namelessCategory() });
    const named = await createCategory("hr", { title: "Ponuda", seoName: "ponuda" });
    await createArticle("hr", { title: "Cjenik 2", slug: "cjenik", category: named.id });

    expect(await rejection(updateCategory(named.id, "hr", { seoName: null }), "seoName"))
      .toBeDefined();
  });

  it("allows removing an SEO Name when the Category's Articles stay unique", async () => {
    const named = await createCategory("hr", { title: "Arhiva", seoName: "arhiva" });
    await createArticle("hr", { title: "Stari članak", slug: "stari-clanak", category: named.id });

    expect(await rejection(updateCategory(named.id, "hr", { seoName: null }), "seoName"))
      .toBeUndefined();
  });

  it("allows a nameless Category to take the slug of one of its own Articles as SEO Name", async () => {
    const category = await namelessCategory();
    await createArticle("hr", { title: "Događanja", slug: "dogadanja", category });

    expect(await rejection(updateCategory(category, "hr", { seoName: "dogadanja" }), "seoName"))
      .toBeUndefined();
  });

  it("rejects moving an Article into a nameless Category when its slug in another Locale collides", async () => {
    await createArticle("en", { title: "Careers", slug: "careers", category: await namelessCategory() });
    const named = await createCategory("hr", { title: "Posao", seoName: "posao" });
    await updateCategory(named.id, "en", { title: "Jobs", seoName: "jobs" });
    const article = await createArticle("hr", { title: "Karijere", slug: "karijere", category: named.id });
    await payload.update({
      collection: "articles",
      id: article.id,
      locale: "en",
      data: { title: "Careers", slug: "careers" },
      ...testWrite,
    });

    const move = payload.update({
      collection: "articles",
      id: article.id,
      locale: "hr",
      data: { category: await namelessCategory() },
      ...testWrite,
    });

    expect(await rejection(move, "category")).toBeDefined();
  });

  it("finds a colliding Standalone Article behind many same-slug Articles in named Categories", async () => {
    await createArticle("hr", {
      title: "Isti",
      slug: "isti",
      category: await namelessCategory(),
      publishedAt: "2020-01-01T00:00:00.000Z",
    });
    // Slugs are unique within a Category, so each needs its own named Category.
    for (let i = 0; i < 10; i++) {
      const named = await createCategory("hr", { title: `Mnogo ${i}`, seoName: `mnogo-${i}` });
      await createArticle("hr", { title: `Isti ${i}`, slug: "isti", category: named.id });
    }

    expect(
      await rejection(createCategory("hr", { title: "Isti", seoName: "isti" }), "seoName"),
    ).toBeDefined();
  }, 120_000); // 21 validated writes against a remote database
});

describe("Article slugs inside a named Category", () => {
  it("rejects a slug another Article in the same Category uses", async () => {
    const named = await createCategory("hr", { title: "Vodiči", seoName: "vodici" });
    await createArticle("hr", { title: "Početak", slug: "pocetak", category: named.id });

    expect(
      await rejection(
        createArticle("hr", { title: "Početak 2", slug: "pocetak", category: named.id }),
        "slug",
      ),
    ).toBeDefined();
  });

  it("allows the same slug in another named Category", async () => {
    const first = await createCategory("hr", { title: "Recepti", seoName: "recepti" });
    const second = await createCategory("hr", { title: "Savjeti", seoName: "savjeti" });
    await createArticle("hr", { title: "Uvod", slug: "uvod", category: first.id });

    expect(
      await rejection(createArticle("hr", { title: "Uvod", slug: "uvod", category: second.id }), "slug"),
    ).toBeUndefined();
  });

  it("allows a slug that a Category uses as its SEO Name", async () => {
    await createCategory("hr", { title: "Galerija", seoName: "galerija" });
    const named = await createCategory("hr", { title: "Mediji", seoName: "mediji" });

    expect(
      await rejection(
        createArticle("hr", { title: "Galerija", slug: "galerija", category: named.id }),
        "slug",
      ),
    ).toBeUndefined();
  });
});

describe("Drafts claim the same rules", () => {
  // Payload skips field validation for Draft saves unless the collection opts
  // in, so these write with `draft: true`, as the admin's "Save draft" does.
  it("rejects a reserved slug saved as a Draft", async () => {
    const save = payload.create({
      collection: "articles",
      locale: "hr",
      draft: true,
      data: {
        title: "Nacrt",
        slug: "admin",
        category: await namelessCategory(),
        publishedAt: new Date().toISOString(),
      },
      ...testWrite,
    });

    expect(await rejection(save, "slug")).toBeDefined();
  });

  it("rejects a Draft taking a slug another Article in its Category uses", async () => {
    const named = await createCategory("hr", { title: "Nacrti", seoName: "nacrti-kat" });
    await createArticle("hr", { title: "Zauzeto", slug: "zauzeto", category: named.id });

    const save = payload.create({
      collection: "articles",
      locale: "hr",
      draft: true,
      data: {
        title: "Zauzeto 2",
        slug: "zauzeto",
        category: named.id,
        publishedAt: new Date().toISOString(),
      },
      ...testWrite,
    });

    expect(await rejection(save, "slug")).toBeDefined();
  });
});

describe("validation that reads other Locales", () => {
  // The slug and Category rules read the Article in every Locale. Those reads
  // must not change which Locale the save itself writes.
  it("saves an edit in the Locale being edited", async () => {
    const named = await createCategory("hr", { title: "Bilješke", seoName: "biljeske" });
    const article = await createArticle("hr", { title: "Bilješka", slug: "biljeska", category: named.id });
    await payload.update({
      collection: "articles",
      id: article.id,
      locale: "en",
      data: { title: "Note", slug: "note" },
      ...testWrite,
    });

    await payload.update({
      collection: "articles",
      id: article.id,
      locale: "hr",
      data: { title: "Bilješka, izmijenjena" },
      ...testWrite,
    });

    const saved = await payload.findByID({
      collection: "articles",
      id: article.id,
      locale: "all",
      depth: 0,
      overrideAccess: true,
    });
    expect(saved.title).toEqual({ hr: "Bilješka, izmijenjena", en: "Note" });
  });
});

describe("Article List page numbers in the second segment", () => {
  it("reads canonical numbers as pages", () => {
    expect(pageNumber("1")).toBe(1);
    expect(pageNumber("12")).toBe(12);
  });

  it("reads nothing else as a page", () => {
    for (const segment of ["0", "02", "-1", "1.5", "2a", "moj-clanak", ""]) {
      expect(pageNumber(segment)).toBeUndefined();
    }
  });
});
