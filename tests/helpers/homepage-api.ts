import { expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";

import type { Locale } from "../../lib/i18n/locales";
import { editorHeaders } from "./editor-api";

/** A Section as the REST API takes it. */
export type SectionData = Record<string, unknown>;

/** The Homepage's Sections in one Locale, as the admin reads them. */
export async function homepageSections(
  request: APIRequestContext,
  locale: Locale,
): Promise<SectionData[]> {
  const response = await request.get(`/api/globals/homepage?locale=${locale}&depth=0`, {
    headers: await editorHeaders(request),
  });
  expect(response.ok()).toBe(true);
  return (await response.json()).sections ?? [];
}

/** Saves the Homepage the way the admin does: an authenticated REST update. */
export async function saveSections(
  request: APIRequestContext,
  locale: Locale,
  sections: SectionData[],
) {
  const response = await request.post(`/api/globals/homepage?locale=${locale}`, {
    headers: await editorHeaders(request),
    data: { sections },
  });
  expect(response.ok()).toBe(true);
}
