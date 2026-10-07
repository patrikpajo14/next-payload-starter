import { RichText } from "@payloadcms/richtext-lexical/react";
import Image from "next/image";

import type { Locale } from "@/lib/i18n/locales";
import { messages } from "@/lib/i18n/messages";
import { articlePath } from "@/lib/url-segments";
import type { Article } from "@/payload-types";

import { ContactForm } from "./ContactForm";

/** Address and title of the Article the Contact Form's consent links to, if it can be linked. */
function privacyPolicyLink(article: Article, locale: Locale) {
  const policy = typeof article.privacyPolicy === "object" ? article.privacyPolicy : null;
  const href = articlePath(locale, policy);
  return policy && href ? { href, title: policy.title } : null;
}

/**
 * An Article's Page content. Empty fields are skipped: no cover image, no
 * image element; no body, no body container. The Contact Form shows below the
 * body when the Article asks for it.
 */
export function ArticleContent({ article, locale }: { article: Article; locale: Locale }) {
  const cover = typeof article.coverImage === "object" ? article.coverImage : null;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
      <article>
        {cover?.url && cover.width && cover.height ? (
          <Image
            src={cover.url}
            alt={cover.alt ?? ""}
            width={cover.width}
            height={cover.height}
            sizes="(min-width: 768px) 768px, 100vw"
            // The cover is the largest image above the fold.
            loading="eager"
            fetchPriority="high"
            className="mb-8 h-auto w-full rounded"
          />
        ) : null}
        <h1 className="text-3xl font-semibold">{article.title}</h1>
        <time dateTime={article.publishedAt} className="mt-2 block text-sm opacity-70">
          {new Date(article.publishedAt).toLocaleDateString(locale, { dateStyle: "long" })}
        </time>
        {article.body?.root.children.length ? (
          <RichText data={article.body} className="prose mt-8" />
        ) : null}
      </article>
      {article.showContactForm ? (
        <ContactForm
          locale={locale}
          t={messages[locale].contact}
          privacyPolicy={privacyPolicyLink(article, locale)}
        />
      ) : null}
    </main>
  );
}
