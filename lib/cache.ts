import { revalidateTag } from "next/cache";

/**
 * Tag carried by every piece of cached data that appears on all Pages (Header,
 * Footer, Homepage). Invalidating it refreshes every Page.
 */
export const ALL_PAGES_TAG = "all-pages";

export function revalidateAllPages(): void {
  revalidateTag(ALL_PAGES_TAG, "max");
}
