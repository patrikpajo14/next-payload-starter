import config from "@payload-config";
import { unstable_cache } from "next/cache";
import { getPayload } from "payload";
import type { Where } from "payload";

import type { Article, Category } from "@/payload-types";

import { CONTENT_TAG } from "./cache";
import type { Locale } from "./i18n/locales";
import { hostsStandaloneArticles } from "./url-segments";

/** An Article with its Category populated. */
export type ArticleWithCategory = Article & { category: Category };

// Public reads never rely on Local API defaults: access control applies (it
// keeps Drafts from Visitors), Draft versions are never requested, and
// `fallbackLocale: false` reads each Locale on its own, as the URL segment
// validation does. With fallback, a Category named only in Croatian would
// borrow that SEO Name in English and stop hosting Standalone Articles there.
// (An untranslated Article is a 404 because its slug exists only where set.)
const publicRead = { overrideAccess: false, draft: false, fallbackLocale: false } as const;

/**
 * True when the Article is a Standalone Article with a title in this Locale:
 * its Category has no SEO Name here.
 */
function isPublicStandalone(article: Article): article is ArticleWithCategory {
  return Boolean(article.title) && hostsStandaloneArticles(article.category);
}

/** True when the Article has a title in this Locale and its Category has an SEO Name here. */
function isPublicCategoryArticle(
  article: Article,
): article is Article & { category: Category & { seoName: string } } {
  return (
    Boolean(article.title) && typeof article.category === "object" && Boolean(article.category.seoName)
  );
}

/**
 * The Standalone Article at `/<locale>/<slug>`, or null when there is none or
 * it has no title in this Locale. Tagged with CONTENT_TAG, including the null
 * result, so publishing a matching Article replaces a cached 404.
 */
export const getStandaloneArticle = unstable_cache(
  async (locale: Locale, slug: string): Promise<ArticleWithCategory | null> => {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      ...publicRead,
      collection: "articles",
      locale,
      where: { slug: { equals: slug } },
      // Depth 2 populates the privacy policy Article with its Category, to link it.
      depth: 2,
    });
    return docs.find(isPublicStandalone) ?? null;
  },
  ["standalone-article"],
  { tags: [CONTENT_TAG], revalidate: 3600 },
);

/** The Category with this SEO Name and a title in this Locale. Uncached; callers cache. */
async function findNamedCategory(locale: Locale, seoName: string): Promise<Category | null> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    ...publicRead,
    collection: "categories",
    locale,
    where: { seoName: { equals: seoName } },
    depth: 0,
    limit: 1,
  });
  const category = docs[0];
  return category?.title ? category : null;
}

/**
 * The Article at `/<locale>/<seoName>/<slug>`: in the Category with that SEO
 * Name in this Locale, with a title there. Null otherwise, and cached like a
 * hit so publishing replaces a cached 404.
 */
export const getCategoryArticle = unstable_cache(
  async (locale: Locale, seoName: string, slug: string): Promise<ArticleWithCategory | null> => {
    const category = await findNamedCategory(locale, seoName);
    if (!category) return null;

    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      ...publicRead,
      collection: "articles",
      locale,
      where: { and: [{ slug: { equals: slug } }, { category: { equals: category.id } }] },
      depth: 2,
      limit: 1,
    });
    const article = docs[0];
    return article?.title ? { ...article, category } : null;
  },
  ["category-article"],
  { tags: [CONTENT_TAG], revalidate: 3600 },
);

/** Articles on each Article List page. */
const ARTICLES_PER_PAGE = 9;

/** One numbered page of a Category's Article List. */
export interface ArticleListPage {
  category: Category & { seoName: string };
  articles: Article[];
  page: number;
  totalPages: number;
}

/**
 * Page `page` of the Article List at `/<locale>/<seoName>`: the Category's
 * Articles with a title in this Locale, newest first. Page 1 always exists,
 * even when empty. Null for an unknown SEO Name or a page past the last, cached
 * like a hit so a new Article replaces a cached 404.
 */
export const getArticleListPage = unstable_cache(
  async (locale: Locale, seoName: string, page: number): Promise<ArticleListPage | null> => {
    const category = await findNamedCategory(locale, seoName);
    if (!category) return null;

    const payload = await getPayload({ config });
    // An Article with no title in this Locale is listed only in the Locales where it has one.
    const where: Where = { and: [{ category: { equals: category.id } }, { title: { exists: true } }] };
    // Count first: Postgres would scan to any offset a Visitor types into the URL.
    // `count` takes no Draft or fallback options; access control alone keeps Drafts out.
    const { totalDocs } = await payload.count({
      overrideAccess: false,
      collection: "articles",
      locale,
      where,
    });
    const totalPages = Math.max(1, Math.ceil(totalDocs / ARTICLES_PER_PAGE));
    if (page > totalPages) return null;

    const { docs } = await payload.find({
      ...publicRead,
      collection: "articles",
      locale,
      where,
      // The id breaks ties between Articles published the same day, so no
      // Article shows on two pages or none.
      sort: ["-publishedAt", "-id"],
      limit: ARTICLES_PER_PAGE,
      page,
      depth: 1,
    });
    return { category: { ...category, seoName }, articles: docs, page, totalPages };
  },
  ["article-list-page"],
  { tags: [CONTENT_TAG], revalidate: 3600 },
);

/** Every Article a Visitor can read in this Locale, with its Category. For static generation. */
async function listPublicArticles(locale: Locale): Promise<Article[]> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    ...publicRead,
    collection: "articles",
    locale,
    depth: 1,
    pagination: false,
  });
  return docs;
}

/** `{ seoName, slug }` of every Article in a named Category with a title in this Locale. */
export async function listCategoryArticlePaths(
  locale: Locale,
): Promise<Array<{ seoName: string; slug: string }>> {
  const articles = await listPublicArticles(locale);
  return articles.filter(isPublicCategoryArticle).map((article) => ({
    seoName: article.category.seoName,
    slug: article.slug,
  }));
}

/** Slugs of every Standalone Article with a title in this Locale. */
export async function listStandaloneSlugs(locale: Locale): Promise<string[]> {
  const articles = await listPublicArticles(locale);
  return articles.filter(isPublicStandalone).map((article) => article.slug);
}

/** SEO Names of every Category with an Article List in this Locale. For static generation. */
export async function listArticleListSeoNames(locale: Locale): Promise<string[]> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    ...publicRead,
    collection: "categories",
    locale,
    where: { seoName: { exists: true } },
    depth: 0,
    pagination: false,
  });
  return docs.flatMap((category) =>
    category.title && category.seoName ? [category.seoName] : [],
  );
}
