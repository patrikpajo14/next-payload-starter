import { revalidateTag } from "next/cache";

/**
 * Tag carried by every piece of cached data that appears on all Pages (Header,
 * Footer, Homepage). Invalidating it refreshes every Page.
 *
 * Payload's Local API reads the database directly, so nothing is tagged
 * automatically: wrap each such read in `unstable_cache(fn, keys, { tags:
 * [ALL_PAGES_TAG] })` for the tag to have any effect.
 */
export const ALL_PAGES_TAG = "all-pages";

/** Call after an Editor saves shared content. Expires at once, so no Visitor sees stale content. */
export function revalidateAllPages(): void {
  revalidateTag(ALL_PAGES_TAG, { expire: 0 });
}
