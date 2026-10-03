import { expect, test } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";

import type { Locale } from "../../lib/i18n/locales";
import { signInAsEditor } from "../helpers/admin";
import { editorHeaders } from "../helpers/editor-api";
import { paragraphs } from "../helpers/rich-text";

// Seeded by tests/helpers/reset-and-seed.ts: the privacy policy in both
// Locales, and an Article that exists only in Croatian.

test.describe("Standalone Article", () => {
  // First in this file, so no earlier request can have generated the Page on demand.
  test("is generated at build time", async ({ request }) => {
    const response = await request.get("/hr/politika-privatnosti");

    expect(response.headers()["x-nextjs-cache"]).toBe("HIT");
  });

  test("is served in Croatian at its Croatian slug", async ({ page }) => {
    const response = await page.goto("/hr/politika-privatnosti");

    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "hr");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Politika privatnosti");
    await expect(page.getByText("Vaši podaci su sigurni.")).toBeVisible();
  });

  test("is served in English at its English slug", async ({ page }) => {
    const response = await page.goto("/en/privacy-policy");

    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy policy");
    await expect(page.getByText("Your data is safe.")).toBeVisible();
  });

  test("is not served at the other Locale's slug", async ({ page }) => {
    const response = await page.goto("/en/politika-privatnosti");

    expect(response?.status()).toBe(404);
  });

  test("without an English title is a 404 in English and still served in Croatian", async ({
    page,
  }) => {
    expect((await page.goto("/hr/samo-hrvatski"))?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Samo na hrvatskom");

    const response = await page.goto("/en/samo-hrvatski");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
  });

  test("deeper unknown paths are still a 404", async ({ page }) => {
    const response = await page.goto("/hr/politika-privatnosti/nesto/dalje");

    expect(response?.status()).toBe(404);
  });
});

async function findArticle(request: APIRequestContext, locale: Locale, slug: string) {
  const response = await request.get(
    `/api/articles?locale=${locale}&fallback-locale=none&where[slug][equals]=${slug}&depth=0`,
  );
  const { docs } = await response.json();
  expect(docs).toHaveLength(1);
  return docs[0] as { id: number; category: number };
}

test.describe("revalidation after an Editor saves", () => {
  test("changing an Article's title refreshes its Page", async ({ page, request }) => {
    await page.goto("/en/privacy-policy");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy policy");

    const { id } = await findArticle(request, "en", "privacy-policy");
    const headers = await editorHeaders(request);

    try {
      const response = await request.patch(`/api/articles/${id}?locale=en`, {
        headers,
        data: { title: "Privacy notice" },
      });
      expect(response.ok()).toBe(true);

      await page.goto("/en/privacy-policy");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy notice");
    } finally {
      await request.patch(`/api/articles/${id}?locale=en`, {
        headers,
        data: { title: "Privacy policy" },
      });
    }
  });

  test("publishing a new Article replaces a cached 404", async ({ page, request }) => {
    expect((await page.goto("/hr/novi-clanak"))?.status()).toBe(404);

    const { category } = await findArticle(request, "hr", "politika-privatnosti");
    const headers = await editorHeaders(request);
    const created = await request.post("/api/articles?locale=hr", {
      headers,
      data: {
        title: "Novi članak",
        slug: "novi-clanak",
        category,
        body: paragraphs("Upravo objavljeno."),
      },
    });
    expect(created.ok()).toBe(true);
    const { doc } = await created.json();

    try {
      const response = await page.goto("/hr/novi-clanak");
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Novi članak");
    } finally {
      await request.delete(`/api/articles/${doc.id}`, { headers });
    }

    expect((await page.goto("/hr/novi-clanak"))?.status()).toBe(404);
  });
});

test("an Editor creates a nameless Category and a Standalone Article in the admin", async ({
  page,
}) => {
  await signInAsEditor(page);

  await page.goto("/admin/collections/categories/create");
  await page.getByRole("textbox", { name: /^Title/ }).fill("Pravne stranice");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/admin\/collections\/categories\/\d+/);

  await page.goto("/admin/collections/articles/create");
  await page.getByRole("textbox", { name: /^Title/ }).fill("Uvjeti korištenja");
  await page.getByRole("textbox", { name: /^Slug/ }).fill("uvjeti-koristenja");
  await page.locator("#field-category").click();
  await page.getByRole("option", { name: "Pravne stranice" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/admin\/collections\/articles\/\d+/);

  const response = await page.goto("/hr/uvjeti-koristenja");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Uvjeti korištenja");
});
