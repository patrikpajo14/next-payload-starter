import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getStandaloneArticle, listStandaloneSlugs } from "@/lib/articles";
import { hasLocale } from "@/lib/i18n/locales";
import { getLocale } from "@/lib/i18n/server";

import { ArticleContent } from "../_components/ArticleContent";

// `[seo_1]` alone is a Standalone Article slug. Under it, `[seo_2]` serves the
// Articles of a named Category; the Category's own Article List at
// `/<locale>/<seo-name>` arrives with the Article List.

export async function generateStaticParams({
  params,
}: {
  params: { locale: string };
}) {
  if (!hasLocale(params.locale)) return [];
  const slugs = await listStandaloneSlugs(params.locale);
  return slugs.map((seo_1) => ({ seo_1 }));
}

async function loadArticle(params: PageProps<"/[locale]/[seo_1]">["params"]) {
  const locale = await getLocale();
  const { seo_1 } = await params;
  const article = await getStandaloneArticle(locale, seo_1);
  if (!article) notFound();
  return { locale, article };
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/[seo_1]">): Promise<Metadata> {
  const { article } = await loadArticle(params);
  return { title: article.title };
}

export default async function StandaloneArticlePage({
  params,
}: PageProps<"/[locale]/[seo_1]">) {
  const { locale, article } = await loadArticle(params);
  return <ArticleContent article={article} locale={locale} />;
}
