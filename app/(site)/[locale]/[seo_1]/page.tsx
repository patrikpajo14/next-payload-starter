import { RichText } from "@payloadcms/richtext-lexical/react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getStandaloneArticle, listStandaloneSlugs } from "@/lib/articles";
import { hasLocale } from "@/lib/i18n/locales";
import { getLocale } from "@/lib/i18n/server";

// `[seo_1]` is a Standalone Article slug for now. The Category Article List
// (an SEO Name in this position) arrives with the Article List.

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
  const published = new Date(article.publishedAt);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
      <article>
        <h1 className="text-3xl font-semibold">{article.title}</h1>
        <time dateTime={article.publishedAt} className="mt-2 block text-sm opacity-70">
          {published.toLocaleDateString(locale, { dateStyle: "long" })}
        </time>
        {/* Empty fields are skipped: no body, no body container. */}
        {article.body?.root.children.length ? (
          <RichText data={article.body} className="prose mt-8" />
        ) : null}
      </article>
    </main>
  );
}
