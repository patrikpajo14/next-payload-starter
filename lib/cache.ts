import { revalidateTag } from "next/cache";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from "payload";

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

/**
 * `afterChange` hook for globals shown on every Page.
 *
 * `revalidateTag` only works inside a running Next.js server, so scripts that
 * write through the Local API (seeds, tests) pass `context: { disableRevalidate: true }`.
 */
export const revalidateAllPagesAfterChange: GlobalAfterChangeHook = ({ context }) => {
  if (!context.disableRevalidate) revalidateAllPages();
};

/**
 * Tag carried by every cached read of Articles (with their Category and cover
 * image) and Categories, including the
 * lookups that end in a 404, so a newly published slug stops 404ing at once.
 */
export const CONTENT_TAG = "content";

function revalidateContent(context: Record<string, unknown>): void {
  if (!context.disableRevalidate) revalidateTag(CONTENT_TAG, { expire: 0 });
}

/**
 * Saving a Draft of a never-published document changes nothing Visitors see.
 * Documents without Drafts (Categories, Media) always count.
 */
function affectsVisitors(doc: { _status?: unknown }, previousDoc?: { _status?: unknown }): boolean {
  if (!("_status" in doc)) return true;
  return doc._status === "published" || previousDoc?._status === "published";
}

/**
 * `afterChange` hook for Articles, Categories, and Media (cover images are read
 * with their Article). Honours `disableRevalidate` like the globals.
 */
export const revalidateContentAfterChange: CollectionAfterChangeHook = ({
  context,
  doc,
  previousDoc,
}) => {
  if (affectsVisitors(doc, previousDoc)) revalidateContent(context);
};

/** `afterDelete` hook for Articles, Categories, and Media. */
export const revalidateContentAfterDelete: CollectionAfterDeleteHook = ({ context }) => {
  revalidateContent(context);
};
