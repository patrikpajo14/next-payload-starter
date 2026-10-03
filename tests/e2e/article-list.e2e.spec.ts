import { expect, test } from "@playwright/test";
import type { APIRequestContext, Page } from "@playwright/test";

import type { Locale } from "../../lib/i18n/locales";
import { editorHeaders } from "../helpers/editor-api";

// Seeded by tests/helpers/reset-and-seed.ts: the Articles Category (`clanci` /
// `articles`) with an intro and 12 Croatian and 11 English Articles, two pages each.

const lists: Array<{
  locale: Locale;
  path: string;
  title: string;
  intro: string;
  /** Name of the page links' navigation. */
  pagesLabel: string;
  firstPage: string[];
  secondPage: string[];
}> = [
  {
    locale: "hr",
    path: "/hr/clanci",
    title: "Članci",
    intro: "Novosti i priče našeg tima.",
    pagesLabel: "Stranice",
    firstPage: [10, 9, 8, 7, 6, 5, 4, 3, 2].map((n) => `Članak ${n}`),
    // An Article with no English title is listed only in Croatian.
    secondPage: ["Članak 1", "Moj članak", "Samo hrvatski članak"],
  },
  {
    locale: "en",
    path: "/en/articles",
    title: "Articles",
    intro: "News and stories from our team.",
    pagesLabel: "Pages",
    firstPage: [10, 9, 8, 7, 6, 5, 4, 3, 2].map((n) => `Article ${n}`),
    secondPage: ["Article 1", "My article"],
  },
];

/** The Article titles listed on the Page, in order. */
const listedTitles = (page: Page) =>
  page.getByRole("main").getByRole("listitem").getByRole("heading").allTextContents();

for (const list of lists) {
  test.describe(`Article List in ${list.locale}`, () => {
    test("lists the 9 newest Articles with the Category intro", async ({ page }) => {
      const response = await page.goto(list.path);

      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(list.title);
      await expect(page.getByText(list.intro)).toBeVisible();
      expect(await listedTitles(page)).toEqual(list.firstPage);
    });

    test("links each Article to its Page", async ({ page }) => {
      await page.goto(list.path);
      await page.getByRole("link", { name: list.firstPage[0] }).click();

      await expect(page.getByRole("heading", { level: 1 })).toHaveText(list.firstPage[0]);
    });

    test("serves page 2 at a numbered URL, cached after the first request", async ({
      page,
      request,
    }) => {
      const response = await page.goto(`${list.path}/2`);

      expect(response?.status()).toBe(200);
      expect(await listedTitles(page)).toEqual(list.secondPage);
      expect((await request.get(`${list.path}/2`)).headers()["x-nextjs-cache"]).toBe("HIT");
    });

    test("numbers its pages", async ({ page }) => {
      await page.goto(`${list.path}/2`);
      const pages = page.getByRole("navigation", { name: list.pagesLabel });

      await expect(pages.getByRole("link", { name: "2", exact: true })).toHaveAttribute("aria-current", "page");
      await pages.getByRole("link", { name: "1", exact: true }).click();
      await expect(page).toHaveURL(list.path);
    });

    test("redirects page 1 permanently with a 301", async ({ request }) => {
      const response = await request.get(`${list.path}/1`, { maxRedirects: 0 });

      expect(response.status()).toBe(301);
      expect(new URL(response.headers().location, "http://x").pathname).toBe(list.path);
    });

    for (const pageNumber of ["3", "0", "02"]) {
      test(`page ${pageNumber} is a 404`, async ({ request }) => {
        expect((await request.get(`${list.path}/${pageNumber}`)).status()).toBe(404);
      });
    }
  });
}

/** The id of the Articles Category. */
async function articlesCategoryId(request: APIRequestContext, headers: Record<string, string>) {
  const response = await request.get(
    "/api/categories?locale=hr&where[seoName][equals]=clanci&depth=0",
    { headers },
  );
  return (await response.json()).docs[0].id as number;
}

for (const list of lists) {
  test(`publishing an Article refreshes every list page in ${list.locale}`, async ({
    page,
    request,
  }) => {
    const headers = await editorHeaders(request);
    const title = list.locale === "hr" ? "Najnoviji članak" : "Newest article";

    // Cache both pages before the change.
    await page.goto(`${list.path}/2`);
    await page.goto(list.path);

    const created = await request.post(`/api/articles?locale=${list.locale}&draft=true`, {
      headers,
      data: {
        title,
        slug: list.locale === "hr" ? "najnoviji-clanak" : "newest-article",
        category: await articlesCategoryId(request, headers),
        publishedAt: "2026-04-01T00:00:00.000Z",
        _status: "draft",
      },
    });
    expect(created.ok()).toBe(true);
    const { doc } = await created.json();

    try {
      await page.goto(list.path);
      expect(await listedTitles(page)).toEqual(list.firstPage);

      const published = await request.patch(`/api/articles/${doc.id}?locale=${list.locale}`, {
        headers,
        data: { _status: "published" },
      });
      expect(published.ok()).toBe(true);

      await page.goto(list.path);
      expect(await listedTitles(page)).toEqual([title, ...list.firstPage.slice(0, 8)]);
      await page.goto(`${list.path}/2`);
      expect(await listedTitles(page)).toEqual([list.firstPage[8], ...list.secondPage]);
    } finally {
      await request.delete(`/api/articles/${doc.id}`, { headers });
    }

    await page.goto(list.path);
    expect(await listedTitles(page)).toEqual(list.firstPage);
  });

  test(`editing an Article refreshes the list in ${list.locale}`, async ({ page, request }) => {
    const headers = await editorHeaders(request);
    const [newest] = list.firstPage;
    await page.goto(list.path);

    const found = await request.get(
      `/api/articles?locale=${list.locale}&where[title][equals]=${encodeURIComponent(newest)}`,
      { headers },
    );
    const [{ id }] = (await found.json()).docs;
    const setTitle = (title: string) =>
      request.patch(`/api/articles/${id}?locale=${list.locale}`, { headers, data: { title } });

    try {
      expect((await setTitle(`${newest} v2`)).ok()).toBe(true);

      await page.goto(list.path);
      expect((await listedTitles(page))[0]).toBe(`${newest} v2`);
    } finally {
      await setTitle(newest);
    }
  });
}
