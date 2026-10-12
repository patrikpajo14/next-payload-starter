import config from "@payload-config";
import { getPayload } from "payload";
import type { Payload } from "payload";
import { beforeAll, describe, expect, it, vi } from "vitest";

import type { Locale } from "../../lib/i18n/locales";
import { testWrite } from "../helpers/local-api";
import { paragraphs } from "../helpers/rich-text";

// `unstable_cache` needs a running Next.js server; run the reads uncached.
vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  revalidateTag: () => {},
}));

const { getArticleListPage, getStandaloneArticle, listCategoryArticlePaths, listStandaloneSlugs } =
  await import("../../lib/articles");

let payload: Payload;

beforeAll(async () => {
  payload = await getPayload({ config });
});

const unique = () => crypto.randomUUID().slice(0, 8);

const createCategory = (locale: Locale, data: { title: string; seoName?: string }) =>
  payload.create({ collection: "categories", locale, data, ...testWrite });

const publish = (locale: Locale, data: { title: string; slug: string; category: number }) =>
  payload.create({
    collection: "articles",
    locale,
    data: {
      publishedAt: new Date().toISOString(),
      _status: "published",
      body: paragraphs(data.title),
      ...data,
    },
    ...testWrite,
  });

describe("getStandaloneArticle", () => {
  it("returns the Standalone Article, not a same-slug Article in a named Category", async () => {
    const slug = `uvjeti-${unique()}`;
    const named = await createCategory("hr", { title: "Imenovana", seoName: `imenovana-${unique()}` });
    const nameless = await createCategory("hr", { title: "Bez imena" });
    await publish("hr", { title: "U kategoriji", slug, category: named.id });
    const standalone = await publish("hr", { title: "Samostalni", slug, category: nameless.id });

    const found = await getStandaloneArticle("hr", slug);

    expect(found?.id).toBe(standalone.id);
    expect(found?.category.id).toBe(nameless.id);
  });

  it("returns null when the slug belongs only to an Article in a named Category", async () => {
    const slug = `samo-u-kategoriji-${unique()}`;
    const named = await createCategory("hr", { title: "Imenovana", seoName: `imenovana-${unique()}` });
    await publish("hr", { title: "U kategoriji", slug, category: named.id });

    expect(await getStandaloneArticle("hr", slug)).toBeNull();
  });

  it("reads the Category's SEO Name in the Locale asked for", async () => {
    // No SEO Name in hr, one in en: standalone in hr only.
    const slug = `dvojezicni-${unique()}`;
    const category = await createCategory("hr", { title: "Kategorija" });
    await payload.update({
      collection: "categories",
      id: category.id,
      locale: "en",
      data: { title: "Category", seoName: `category-${unique()}` },
      ...testWrite,
    });
    const article = await publish("hr", { title: "Članak", slug, category: category.id });
    await payload.update({
      collection: "articles",
      id: article.id,
      locale: "en",
      data: { title: "Article", slug, _status: "published" },
      ...testWrite,
    });

    expect((await getStandaloneArticle("hr", slug))?.id).toBe(article.id);
    expect(await getStandaloneArticle("en", slug)).toBeNull();
  });

  it("returns an Article whose Category has an empty SEO Name", async () => {
    const slug = `prazan-naziv-${unique()}`;
    const category = await createCategory("hr", { title: "Prazan naziv", seoName: "" });
    const article = await publish("hr", { title: "Članak", slug, category: category.id });

    expect((await getStandaloneArticle("hr", slug))?.id).toBe(article.id);
  });

  it("does not return a Draft", async () => {
    const slug = `skica-${unique()}`;
    const nameless = await createCategory("hr", { title: "Bez imena" });
    await payload.create({
      collection: "articles",
      locale: "hr",
      draft: true,
      data: { title: "Skica", slug, category: nameless.id, publishedAt: new Date().toISOString() },
      ...testWrite,
    });

    expect(await getStandaloneArticle("hr", slug)).toBeNull();
  });
});

describe("static generation lists", () => {
  it("lists category paths and standalone slugs", async () => {
    const seoName = `staticka-${unique()}`;
    const slug = `staticki-${unique()}`;
    const named = await createCategory("hr", { title: "Statička", seoName });
    const nameless = await createCategory("hr", { title: "Bez imena" });
    await publish("hr", { title: "U kategoriji", slug, category: named.id });
    await publish("hr", { title: "Samostalni", slug: `${slug}-s`, category: nameless.id });

    expect(await listCategoryArticlePaths("hr")).toContainEqual({ seoName, slug });
    expect(await listStandaloneSlugs("hr")).toContain(`${slug}-s`);
    expect(await listStandaloneSlugs("hr")).not.toContain(slug);
  });

  it("reads Articles without their body", async () => {
    const spy = vi.spyOn(payload, "find");
    await listStandaloneSlugs("hr");

    const articleReads = spy.mock.calls.filter(([args]) => args.collection === "articles");
    spy.mockRestore();
    expect(articleReads).toHaveLength(1);
    expect(articleReads[0][0].select).toEqual({ slug: true, category: true, title: true });
  });
});

describe("getArticleListPage", () => {
  it("returns cards with title, slug and date, without a body", async () => {
    const seoName = `lista-${unique()}`;
    const category = await createCategory("hr", { title: "Lista", seoName });
    await publish("hr", { title: "Prvi", slug: `prvi-${unique()}`, category: category.id });

    const list = await getArticleListPage("hr", seoName, 1);

    expect(list?.articles).toHaveLength(1);
    const [card] = list!.articles;
    expect(card.title).toBe("Prvi");
    expect(card.slug).toMatch(/^prvi-/);
    expect(card.publishedAt).toBeTruthy();
    expect(card).not.toHaveProperty("body");
  });
});
