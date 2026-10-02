import config from "@payload-config";
import { unstable_cache } from "next/cache";
import { getPayload } from "payload";
import type { DataFromGlobalSlug } from "payload";

import { ALL_PAGES_TAG } from "./cache";
import type { Locale } from "./i18n/locales";

/**
 * A cached, public read of a global shown on every Page.
 *
 * - `ALL_PAGES_TAG`: saving the global in the admin refreshes every Page.
 * - The Locale argument is part of the cache key.
 * - `revalidate` matches the Pages' 1-hour safety net; without it the data
 *   would stay cached for a year and outlive every hourly Page refresh.
 * - `fallbackLocale: false` leaves a missing translation empty instead of
 *   showing the other Locale's links, which would point into the wrong Locale.
 */
function cachedGlobal<TSlug extends "header" | "footer">(slug: TSlug) {
  return unstable_cache(
    async (locale: Locale): Promise<DataFromGlobalSlug<TSlug>> => {
      const payload = await getPayload({ config });
      return payload.findGlobal({
        slug,
        locale,
        fallbackLocale: false,
        depth: 0,
        overrideAccess: false,
      });
    },
    [slug],
    { tags: [ALL_PAGES_TAG], revalidate: 3600 },
  );
}

export const getHeader = cachedGlobal("header");
export const getFooter = cachedGlobal("footer");
