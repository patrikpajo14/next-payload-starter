import Image from "next/image";
import Link from "next/link";

import type { ArticleListPage } from "@/lib/articles";
import type { Locale } from "@/lib/i18n/locales";
import { articleListPath, categoryArticlePath } from "@/lib/url-segments";

/** One page of a Category's Article List: title, intro, Article cards, and page links. */
export function ArticleList({
  list,
  locale,
  paginationLabel,
}: {
  list: ArticleListPage;
  locale: Locale;
  paginationLabel: string;
}) {
  const { category, articles, page, totalPages } = list;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
      <h1 className="text-3xl font-semibold">{category.title}</h1>
      {category.intro ? <p className="mt-4 text-lg">{category.intro}</p> : null}

      <ul className="mt-10 grid gap-8 sm:grid-cols-2">
        {articles.map((article) => {
          const cover = typeof article.coverImage === "object" ? article.coverImage : null;
          return (
            <li key={article.id}>
              <article>
                {cover?.url && cover.width && cover.height ? (
                  <Image
                    src={cover.url}
                    // The title next to it names the Article; the image adds nothing to read.
                    alt=""
                    width={cover.width}
                    height={cover.height}
                    sizes="(min-width: 640px) 368px, 100vw"
                    className="mb-3 h-auto w-full rounded"
                  />
                ) : null}
                <h2 className="text-xl font-semibold">
                  <Link
                    href={categoryArticlePath(locale, category.seoName, article.slug)}
                    className="hover:underline"
                  >
                    {article.title}
                  </Link>
                </h2>
                <time dateTime={article.publishedAt} className="mt-1 block text-sm opacity-70">
                  {new Date(article.publishedAt).toLocaleDateString(locale, { dateStyle: "long" })}
                </time>
              </article>
            </li>
          );
        })}
      </ul>

      {totalPages > 1 ? (
        <nav aria-label={paginationLabel} className="mt-12">
          <ol className="flex flex-wrap gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <li key={n}>
                <Link
                  href={articleListPath(locale, category.seoName, n)}
                  aria-current={n === page ? "page" : undefined}
                  className="block rounded border px-3 py-1 aria-[current=page]:font-semibold aria-[current=page]:underline"
                >
                  {n}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
    </main>
  );
}
