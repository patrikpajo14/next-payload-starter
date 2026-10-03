import config from "@payload-config";
import { unstable_cache } from "next/cache";
import { getPayload } from "payload";

import type { Article, Category } from "@/payload-types";

import { CONTENT_TAG } from "./cache";
import type { Locale } from "./i18n/locales";
import { hostsStandaloneArticles } from "./url-segments";

/** An Article with its Category populated. */
export type ArticleWithCategory = Article & { category: Category };

// Public reads never rely on Local API defaults: access control applies, and
// `fallbackLocale: false` reads each Locale on its own, as the URL segment
// validation does. With fallback, a Category named only in Croatian would
// borrow that SEO Name in English and stop hosting Standalone Articles there.
// (An untranslated Article is a 404 because its slug exists only where set.)
const publicRead = { overrideAccess: false, fallbackLocale: false } as const;

/**
 * True when the Article is a Standalone Article with a title in this Locale:
 * its Category has no SEO Name here.
 */
function isPublicStandalone(article: Article): article is ArticleWithCategory {
  return Boolean(article.title) && hostsStandaloneArticles(article.category);
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
      depth: 1,
    });
    return docs.find(isPublicStandalone) ?? null;
  },
  ["standalone-article"],
  { tags: [CONTENT_TAG], revalidate: 3600 },
);

/** Slugs of every Standalone Article with a title in this Locale, for static generation. */
export async function listStandaloneSlugs(locale: Locale): Promise<string[]> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    ...publicRead,
    collection: "articles",
    locale,
    depth: 1,
    pagination: false,
  });
  return docs.filter(isPublicStandalone).map((doc) => doc.slug);
}
