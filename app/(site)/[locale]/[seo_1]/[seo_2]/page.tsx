import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getArticleListPage, getCategoryArticle, listCategoryArticlePaths } from "@/lib/articles";
import { hasLocale } from "@/lib/i18n/locales";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { pageNumber } from "@/lib/url-segments";

import { ArticleContent } from "../../_components/ArticleContent";
import { ArticleList } from "../../_components/ArticleList";

// `[seo_1]` is a Category SEO Name. A numeric `[seo_2]` is an Article List
// page number (`/hr/clanci/2`); anything else is an Article slug. Slugs are
// never numeric, so the two can't collide. Page 1 lives at `[seo_1]` alone, and
// `next.config.ts` redirects `/1` there with a 301.

// Only Articles are generated at build. Later list pages are generated on
// first request and cached like any other Page.
export async function generateStaticParams({
  params,
}: {
  params: { locale: string };
}) {
  if (!hasLocale(params.locale)) return [];
  const paths = await listCategoryArticlePaths(params.locale);
  return paths.map(({ seoName, slug }) => ({ seo_1: seoName, seo_2: slug }));
}

async function loadPage(params: PageProps<"/[locale]/[seo_1]/[seo_2]">["params"]) {
  const locale = await getLocale();
  const { seo_1, seo_2 } = await params;

  const page = pageNumber(seo_2);
  if (page !== undefined) {
    // Page 1 never reaches here (it redirects); treat a stray one as unknown.
    const list = page > 1 ? await getArticleListPage(locale, seo_1, page) : null;
    if (!list) notFound();
    return { kind: "list", locale, list } as const;
  }

  const article = await getCategoryArticle(locale, seo_1, seo_2);
  if (!article) notFound();
  return { kind: "article", locale, article } as const;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/[seo_1]/[seo_2]">): Promise<Metadata> {
  const loaded = await loadPage(params);
  if (loaded.kind === "article") return { title: loaded.article.title };

  const t = await getMessages();
  return { title: `${loaded.list.category.title}, ${t.pageNumber(loaded.list.page)}` };
}

export default async function ArticleListOrCategoryArticlePage({
  params,
}: PageProps<"/[locale]/[seo_1]/[seo_2]">) {
  const loaded = await loadPage(params);
  if (loaded.kind === "list") {
    const t = await getMessages();
    return <ArticleList list={loaded.list} locale={loaded.locale} paginationLabel={t.pagination} />;
  }
  return <ArticleContent article={loaded.article} locale={loaded.locale} />;
}
