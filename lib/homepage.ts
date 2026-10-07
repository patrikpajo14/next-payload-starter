import config from "@payload-config";
import { unstable_cache } from "next/cache";
import { getPayload } from "payload";

import type { Homepage } from "@/payload-types";

import { ALL_PAGES_TAG, CONTENT_TAG } from "./cache";
import type { Locale } from "./i18n/locales";

/** One Section of the Homepage, such as a Hero. */
export type Section = NonNullable<Homepage["sections"]>[number];

/**
 * The Homepage's Sections in one Locale, in the order Editors set.
 *
 * - `ALL_PAGES_TAG`: saving the Homepage refreshes it (and every other Page).
 * - `CONTENT_TAG`: images are read with their Sections (`depth: 1`), so a new
 *   file or alt text refreshes the Homepage like it refreshes Articles.
 * - `fallbackLocale: false`: a Locale without Sections shows none rather than
 *   the other Locale's.
 */
export const getHomepageSections = unstable_cache(
  async (locale: Locale): Promise<Section[]> => {
    const payload = await getPayload({ config });
    const homepage = await payload.findGlobal({
      slug: "homepage",
      locale,
      fallbackLocale: false,
      depth: 1,
      overrideAccess: false,
    });
    return homepage.sections ?? [];
  },
  ["homepage"],
  { tags: [ALL_PAGES_TAG, CONTENT_TAG], revalidate: 3600 },
);
