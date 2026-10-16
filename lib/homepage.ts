import config from "@payload-config";
import { unstable_cache } from "next/cache";
import { headers } from "next/headers";
import { getPayload } from "payload";
import type { Payload, TypedUser } from "payload";

import type { Homepage } from "@/payload-types";

import { ALL_PAGES_TAG, CONTENT_TAG } from "./cache";
import type { Locale } from "./i18n/locales";

/** One Section of the Homepage, such as a Hero. */
export type Section = NonNullable<Homepage["sections"]>[number];

/**
 * Reads the Homepage's Sections in one Locale, in the order Editors set.
 *
 * Access control stays on (`overrideAccess: false`), so `draft: true` returns
 * the latest Draft only when `user` is a signed-in Editor; without one it
 * returns the published Homepage.
 *
 * - `depth: 2`: images and Banner CTA Articles are read with their Sections
 *   (the Article's Category gives its address).
 * - `fallbackLocale: false`: a Locale without Sections shows none rather than
 *   the other Locale's.
 */
export async function readHomepageSections(
  payload: Payload,
  locale: Locale,
  { draft = false, user = null }: { draft?: boolean; user?: TypedUser | null } = {},
): Promise<Section[]> {
  const homepage = await payload.findGlobal({
    slug: "homepage",
    locale,
    fallbackLocale: false,
    depth: 2,
    draft,
    user,
    overrideAccess: false,
  });
  return homepage.sections ?? [];
}

/**
 * The published Homepage's Sections, as Visitors see them.
 *
 * - `ALL_PAGES_TAG`: saving the Homepage refreshes it (and every other Page).
 * - `CONTENT_TAG`: a new file, alt text, or slug of something read with the
 *   Sections refreshes the Homepage like it refreshes Articles.
 */
export const getHomepageSections = unstable_cache(
  async (locale: Locale): Promise<Section[]> =>
    readHomepageSections(await getPayload({ config }), locale),
  ["homepage"],
  { tags: [ALL_PAGES_TAG, CONTENT_TAG], revalidate: 3600 },
);

/**
 * The latest Draft of the Homepage's Sections, for an Editor's Live Preview.
 * Call only in Draft Mode: Next then skips every cache for the request, so
 * Draft content is never stored where a Visitor could get it. The Editor comes
 * from the request's Payload session; if it has expired, this returns the
 * published Sections.
 */
export async function getHomepagePreviewSections(locale: Locale): Promise<Section[]> {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await headers() });
  return readHomepageSections(payload, locale, { draft: true, user });
}
