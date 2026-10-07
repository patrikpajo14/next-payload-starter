import type { PayloadRequest, RelationshipFieldValidation, Validate } from "payload";
import { relationship } from "payload/shared";

import type { Article, Category } from "@/payload-types";

import { defaultLocale, hasLocale, locales } from "./i18n/locales";
import type { Locale } from "./i18n/locales";

/**
 * Rules for the URL segments after the Locale.
 *
 * First segment (`/hr/<segment>`): Category SEO Names and Standalone Article
 * slugs share that position, so they share one namespace per Locale.
 * Second segment (`/hr/<seo-name>/<slug>`): an Article's slug is unique among
 * the Articles of its named Category. Numbers are rejected so a later segment can
 * be read as a page number, and `admin` and `api` would shadow Payload.
 *
 * The database can't express these rules, so they run as field validation:
 * check, then write. Two Editors saving the same value at the same moment can
 * both pass; for a site edited by a few Editors that risk is accepted.
 */

const SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED = new Set(["admin", "api"]);

/** A Category hosts Standalone Articles in a Locale when it has no SEO Name there. */
export function hostsStandaloneArticles(category: Category | number | null | undefined): boolean {
  return typeof category === "object" && category !== null && !category.seoName;
}

/**
 * The Article List page number in a second segment (`/hr/clanci/2`), or
 * undefined when the segment is not one. Only canonical numbers count: `0` and
 * `02` are not pages. Page 1 is served without a number; `next.config.ts`
 * redirects `/1` there.
 */
export function pageNumber(segment: string): number | undefined {
  return /^[1-9]\d*$/.test(segment) ? Number(segment) : undefined;
}

/** The address of Article List page `page`: page 1 has no number. */
export function articleListPath(locale: Locale, seoName: string, page: number): string {
  const base = `/${locale}/${seoName}`;
  return page === 1 ? base : `${base}/${page}`;
}

/** The address of an Article in a named Category. */
export function categoryArticlePath(locale: Locale, seoName: string, slug: string): string {
  return `/${locale}/${seoName}/${slug}`;
}

/**
 * The address of an Article read with its Category populated (`depth: 2` from
 * a Section), or null when it can't be linked: the relationship is not
 * populated (an unpublished Article is hidden from Visitors), it has no title
 * or slug in this Locale, or its Category is a bare id.
 */
export function articlePath(locale: Locale, article: Article | number | null | undefined) {
  if (typeof article !== "object" || article === null) return null;
  if (!article.title || !article.slug) return null;
  if (hostsStandaloneArticles(article.category)) return `/${locale}/${article.slug}`;
  if (typeof article.category === "object" && article.category.seoName) {
    return categoryArticlePath(locale, article.category.seoName, article.slug);
  }
  return null;
}

/** The id behind a relationship value, populated or not. */
function relationId(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "object" && value !== null && "id" in value) {
    return (value as { id: number }).id;
  }
  return undefined;
}

type Problem = "format" | "numeric" | "reserved" | "taken" | "takenInCategory" | "articlesCollide";

/** The language of the admin UI, which Editors pick separately from content Locales. */
type AdminLanguage = "hr" | "en";

const problems: Record<AdminLanguage, Record<Problem, string>> = {
  hr: {
    format: "Dopuštena su samo mala slova bez dijakritika, brojke i crtice između njih.",
    numeric: "Vrijednost ne smije biti samo broj.",
    reserved: "Ova vrijednost je rezervirana.",
    taken: "Ovu adresu već koristi druga kategorija ili samostalni članak na ovom jeziku.",
    takenInCategory: "Drugi članak u ovoj kategoriji već koristi ovu adresu na ovom jeziku.",
    articlesCollide:
      "Bez SEO naziva članci ove kategorije postali bi samostalni, a adresa nekog od njih već je zauzeta.",
  },
  en: {
    format: "Use only lowercase letters without diacritics, digits, and single hyphens between them.",
    numeric: "The value can't be a number only.",
    reserved: "This value is reserved.",
    taken: "Another Category or Standalone Article already uses this address in this Locale.",
    takenInCategory: "Another Article in this Category already uses this address in this Locale.",
    articlesCollide:
      "Without an SEO Name this Category's Articles become Standalone Articles, and one of their addresses is taken.",
  },
};

function message(req: PayloadRequest, problem: Problem): string {
  const language: AdminLanguage = req.i18n?.language === "en" ? "en" : "hr";
  return problems[language][problem];
}

function formatProblem(value: string): Problem | undefined {
  if (!SEGMENT.test(value)) return "format";
  if (/^\d+$/.test(value)) return "numeric";
  if (RESERVED.has(value)) return "reserved";
  return undefined;
}

/** The Locale being written. A write without one is in the default Locale, as in Payload. */
function writeLocale(req: PayloadRequest): Locale {
  return req.locale && hasLocale(req.locale) ? req.locale : defaultLocale;
}

/**
 * A request for one Local API read made while validating a save: the save's
 * transaction and user, but its own object. A Local API call writes its
 * `locale` onto the `req` it is given, and the save writes in `req.locale`.
 * Field validators run concurrently, so restoring the Locale afterwards can't
 * work: every read gets a request of its own.
 */
function readRequest(req: PayloadRequest): Partial<PayloadRequest> {
  const { payload, transactionID, user, context, i18n, t } = req;
  return { payload, transactionID, user, context, i18n, t };
}

interface Claim {
  req: PayloadRequest;
  locale: Locale;
  value: string;
  /** Documents that may hold `value` without a conflict: the one being saved. */
  ignoreCategory?: number | string;
  ignoreArticle?: number | string;
}

/**
 * True when a Category (by SEO Name) or a Standalone Article (by slug) already
 * uses the value in this Locale. Articles of `ignoreCategory` don't count: they
 * belong to the Category being saved.
 */
async function isTaken({ req, locale, value, ignoreCategory, ignoreArticle }: Claim) {
  const read = {
    req: readRequest(req),
    locale,
    fallbackLocale: false,
    overrideAccess: true,
  } as const;

  const categories = await req.payload.find({
    ...read,
    collection: "categories",
    where: {
      and: [
        { seoName: { equals: value } },
        ...(ignoreCategory === undefined ? [] : [{ id: { not_equals: ignoreCategory } }]),
      ],
    },
    depth: 0,
    limit: 1,
  });
  if (categories.totalDocs > 0) return true;

  const articles = await req.payload.find({
    ...read,
    collection: "articles",
    where: {
      and: [
        { slug: { equals: value } },
        ...(ignoreArticle === undefined ? [] : [{ id: { not_equals: ignoreArticle } }]),
      ],
    },
    depth: 1,
    // Articles in named Categories may share a slug; look past all of them.
    pagination: false,
  });
  return articles.docs.some(
    (article) =>
      relationId(article.category) !== ignoreCategory &&
      hostsStandaloneArticles(article.category as Category),
  );
}

/**
 * When a Category drops its SEO Name, its Articles join the shared namespace.
 * True when any of their slugs would then collide, with the namespace or with
 * each other.
 */
async function articlesWouldCollide(req: PayloadRequest, locale: Locale, category: number | string) {
  const { docs } = await req.payload.find({
    req: readRequest(req),
    locale,
    fallbackLocale: false,
    overrideAccess: true,
    collection: "articles",
    where: { category: { equals: category } },
    depth: 0,
    pagination: false,
  });
  const slugs = docs.map((article) => article.slug).filter(Boolean);
  if (new Set(slugs).size < slugs.length) return true;

  for (const slug of slugs) {
    if (await isTaken({ req, locale, value: slug, ignoreCategory: category })) return true;
  }
  return false;
}

/** Validates a Category's optional SEO Name. */
export const validateSeoName: Validate<string> = async (value, { req, id }) => {
  const locale = writeLocale(req);

  if (!value) {
    if (id !== undefined && (await articlesWouldCollide(req, locale, id))) {
      return message(req, "articlesCollide");
    }
    return true;
  }

  const problem = formatProblem(value);
  if (problem) return message(req, problem);

  if (await isTaken({ req, locale, value, ignoreCategory: id })) return message(req, "taken");
  return true;
};

/**
 * Why the Article, in the given Category, can't have its address in some
 * Locale, or undefined when it can. Where the Category hosts Standalone
 * Articles the shared namespace applies; in a named Category, the slugs of its
 * other Articles. `slugs` holds the slugs being saved; other Locales use the
 * stored ones.
 */
async function articleSlugProblem(
  req: PayloadRequest,
  id: number | string | undefined,
  categoryId: number,
  slugs: Partial<Record<Locale, string>>,
): Promise<Problem | undefined> {
  for (const locale of locales) {
    const slug = slugs[locale] ?? (await savedSlug(req, locale, id));
    if (!slug) continue;

    const category = await req.payload.findByID({
      collection: "categories",
      id: categoryId,
      req: readRequest(req),
      locale,
      fallbackLocale: false,
      depth: 0,
      overrideAccess: true,
      disableErrors: true,
    });

    if (hostsStandaloneArticles(category)) {
      if (await isTaken({ req, locale, value: slug, ignoreArticle: id })) return "taken";
    } else if (await siblingHasSlug({ req, locale, value: slug, categoryId, ignoreArticle: id })) {
      return "takenInCategory";
    }
  }
  return undefined;
}

/** True when another Article of the Category already uses the slug in this Locale. */
async function siblingHasSlug({
  req,
  locale,
  value,
  categoryId,
  ignoreArticle,
}: Claim & { categoryId: number }): Promise<boolean> {
  const { totalDocs } = await req.payload.count({
    collection: "articles",
    req: readRequest(req),
    locale,
    overrideAccess: true,
    where: {
      and: [
        { slug: { equals: value } },
        { category: { equals: categoryId } },
        ...(ignoreArticle === undefined ? [] : [{ id: { not_equals: ignoreArticle } }]),
      ],
    },
  });
  return totalDocs > 0;
}

/** Validates an Article's slug in the Locale being edited. */
export const validateArticleSlug: Validate<string> = async (value, { req, id, data }) => {
  if (!value) return message(req, "format");

  const problem = formatProblem(value);
  if (problem) return message(req, problem);

  const categoryId = relationId((data as { category?: unknown })?.category);
  if (categoryId === undefined) return true;

  const slugProblem = await articleSlugProblem(req, id, categoryId, { [writeLocale(req)]: value });
  return slugProblem ? message(req, slugProblem) : true;
};

/**
 * Validates an Article's Category. The Category is the same in every Locale, so
 * moving an Article is checked against its slug in each Locale. This runs even
 * when only the Category is saved, which skips the slug's own validation.
 */
export const validateArticleCategory: RelationshipFieldValidation = async (value, options) => {
  // A custom validate replaces Payload's own, which checks the Category exists.
  const builtIn = await relationship(value, options);
  if (builtIn !== true) return builtIn;

  const { req, id, data } = options;
  const categoryId = relationId(value);
  if (categoryId === undefined) return true;

  const slug = (data as { slug?: unknown })?.slug;
  const editing = typeof slug === "string" && slug ? { [writeLocale(req)]: slug } : {};
  const slugProblem = await articleSlugProblem(req, id, categoryId, editing);
  return slugProblem ? message(req, slugProblem) : true;
};

/** The Article's stored slug in another Locale, if it has been saved there. */
async function savedSlug(req: PayloadRequest, locale: Locale, id: number | string | undefined) {
  if (id === undefined) return undefined;
  const article = await req.payload.findByID({
    collection: "articles",
    id,
    req: readRequest(req),
    locale,
    fallbackLocale: false,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
  });
  return article?.slug ?? undefined;
}
