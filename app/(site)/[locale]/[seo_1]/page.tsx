import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getArticleListPage,
  getStandaloneArticle,
  listArticleListSeoNames,
  listStandaloneSlugs,
} from "@/lib/articles";
import { hasLocale } from "@/lib/i18n/locales";
import { getLocale, getMessages } from "@/lib/i18n/server";

import { ArticleContent } from "../_components/ArticleContent";
import { ArticleList } from "../_components/ArticleList";

// `[seo_1]` is a Category SEO Name, serving page 1 of its Article List, or a
// Standalone Article slug. The two share one namespace per Locale (see
// lib/url-segments.ts), so at most one matches. Under it, `[seo_2]` serves the
// Category's Articles and later list pages.

export async function generateStaticParams({
  params,
}: {
  params: { locale: string };
}) {
  if (!hasLocale(params.locale)) return [];
  const [seoNames, slugs] = await Promise.all([
    listArticleListSeoNames(params.locale),
    listStandaloneSlugs(params.locale),
  ]);
  return [...seoNames, ...slugs].map((seo_1) => ({ seo_1 }));
}

async function loadPage(params: PageProps<"/[locale]/[seo_1]">["params"]) {
  const locale = await getLocale();
  const { seo_1 } = await params;

  const list = await getArticleListPage(locale, seo_1, 1);
  if (list) return { kind: "list", locale, list } as const;

  const article = await getStandaloneArticle(locale, seo_1);
  if (article) return { kind: "article", locale, article } as const;

  notFound();
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/[seo_1]">): Promise<Metadata> {
  const loaded = await loadPage(params);
  return { title: loaded.kind === "list" ? loaded.list.category.title : loaded.article.title };
}

export default async function ArticleListOrStandaloneArticlePage({
  params,
}: PageProps<"/[locale]/[seo_1]">) {
  const loaded = await loadPage(params);
  if (loaded.kind === "list") {
    const t = await getMessages();
    return <ArticleList list={loaded.list} locale={loaded.locale} paginationLabel={t.pagination} />;
  }
  return <ArticleContent article={loaded.article} locale={loaded.locale} />;
}
