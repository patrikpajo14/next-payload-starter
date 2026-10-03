import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCategoryArticle, listCategoryArticlePaths } from "@/lib/articles";
import { hasLocale } from "@/lib/i18n/locales";
import { getLocale } from "@/lib/i18n/server";

import { ArticleContent } from "../../_components/ArticleContent";

// `[seo_1]` is a Category SEO Name and `[seo_2]` an Article slug in it. Slugs
// are never numeric, which leaves numbers free for Article List page numbers.

export async function generateStaticParams({
  params,
}: {
  params: { locale: string };
}) {
  if (!hasLocale(params.locale)) return [];
  const paths = await listCategoryArticlePaths(params.locale);
  return paths.map(({ seoName, slug }) => ({ seo_1: seoName, seo_2: slug }));
}

async function loadArticle(params: PageProps<"/[locale]/[seo_1]/[seo_2]">["params"]) {
  const locale = await getLocale();
  const { seo_1, seo_2 } = await params;
  const article = await getCategoryArticle(locale, seo_1, seo_2);
  if (!article) notFound();
  return { locale, article };
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/[seo_1]/[seo_2]">): Promise<Metadata> {
  const { article } = await loadArticle(params);
  return { title: article.title };
}

export default async function CategoryArticlePage({
  params,
}: PageProps<"/[locale]/[seo_1]/[seo_2]">) {
  const { locale, article } = await loadArticle(params);
  return <ArticleContent article={article} locale={locale} />;
}
