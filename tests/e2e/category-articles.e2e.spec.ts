import { expect, test } from "@playwright/test";

import { editorHeaders } from "../helpers/editor-api";
import { paragraphs } from "../helpers/rich-text";

// Seeded by tests/helpers/reset-and-seed.ts: the Articles Category (`clanci` /
// `articles`) with "Moj članak" / "My article" and its cover image.

test.describe("Article in a Category", () => {
  test("is served in Croatian with its cover image and body", async ({ page }) => {
    const response = await page.goto("/hr/clanci/moj-clanak");

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Moj članak");
    await expect(page.getByText("Tekst mog članka.")).toBeVisible();
    const cover = page.getByRole("img", { name: "Plava naslovnica" });
    await expect(cover).toBeVisible();
    // The image actually loaded, not just its tag.
    await expect.poll(() => cover.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  });

  test("is served in English under the English SEO Name and slug", async ({ page }) => {
    const response = await page.goto("/en/articles/my-article");

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("My article");
    await expect(page.getByRole("img", { name: "Blue cover" })).toBeVisible();
  });

  for (const path of [
    "/en/clanci/moj-clanak", // Croatian SEO Name in English
    "/hr/clanci/my-article", // English slug in Croatian
    "/hr/clanci/politika-privatnosti", // a Standalone Article is not in this Category
    "/hr/nepostojeca/moj-clanak", // no such Category
  ]) {
    test(`${path} is a 404`, async ({ request }) => {
      expect((await request.get(path)).status()).toBe(404);
    });
  }
});

test("a Draft is a 404 until an Editor publishes it", async ({ page, request }) => {
  const headers = await editorHeaders(request);
  const categories = await request.get(
    "/api/categories?locale=hr&where[seoName][equals]=clanci&depth=0",
    { headers },
  );
  const [{ id: categoryId }] = (await categories.json()).docs;

  const created = await request.post("/api/articles?locale=hr&draft=true", {
    headers,
    data: {
      title: "Nacrt članka",
      slug: "nacrt-clanka",
      category: categoryId,
      body: paragraphs("Još nije gotovo."),
      _status: "draft",
    },
  });
  expect(created.ok()).toBe(true);
  const { doc } = await created.json();

  try {
    expect((await page.goto("/hr/clanci/nacrt-clanka"))?.status()).toBe(404);

    const published = await request.patch(`/api/articles/${doc.id}?locale=hr`, {
      headers,
      data: { _status: "published" },
    });
    expect(published.ok()).toBe(true);

    expect((await page.goto("/hr/clanci/nacrt-clanka"))?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Nacrt članka");
  } finally {
    await request.delete(`/api/articles/${doc.id}`, { headers });
  }
});

test("changing a cover image's alt text refreshes the Article Page", async ({ page, request }) => {
  await page.goto("/hr/clanci/moj-clanak");
  await expect(page.getByRole("img", { name: "Plava naslovnica" })).toBeVisible();

  const headers = await editorHeaders(request);
  const media = await request.get("/api/media?locale=hr&where[alt][equals]=Plava naslovnica", {
    headers,
  });
  const [{ id }] = (await media.json()).docs;
  const setAlt = (alt: string) =>
    request.patch(`/api/media/${id}?locale=hr`, { headers, data: { alt } });

  try {
    expect((await setAlt("Tamnoplava naslovnica")).ok()).toBe(true);

    await page.goto("/hr/clanci/moj-clanak");
    await expect(page.getByRole("img", { name: "Tamnoplava naslovnica" })).toBeVisible();
  } finally {
    await setAlt("Plava naslovnica");
  }
});
