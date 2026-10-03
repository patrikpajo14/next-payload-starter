import { expect, test } from "@playwright/test";
import type { APIRequestContext, Page } from "@playwright/test";

import type { Locale } from "../../lib/i18n/locales";
import { editorHeaders } from "../helpers/editor-api";

const header = (page: Page) => page.getByRole("banner");
const footer = (page: Page) => page.getByRole("contentinfo");

test.describe("Header", () => {
  test("shows the Croatian navigation on /hr", async ({ page }) => {
    await page.goto("/hr");

    const link = header(page).getByRole("link", { name: "Članci" });
    await expect(link).toHaveAttribute("href", "/hr/clanci");
    await expect(header(page).getByRole("link", { name: "Articles" })).toHaveCount(0);
  });

  test("shows the English navigation on /en", async ({ page }) => {
    await page.goto("/en");

    const link = header(page).getByRole("link", { name: "Articles" });
    await expect(link).toHaveAttribute("href", "/en/articles");
    await expect(header(page).getByRole("link", { name: "Članci" })).toHaveCount(0);
  });
});

test.describe("Footer", () => {
  test("shows the Croatian text and links on /hr", async ({ page }) => {
    await page.goto("/hr");

    await expect(footer(page)).toContainText("Starter Site, sva prava pridržana.");
    await expect(
      footer(page).getByRole("link", { name: "Politika privatnosti" }),
    ).toHaveAttribute("href", "/hr/politika-privatnosti");
  });

  test("shows the English text and links on /en", async ({ page }) => {
    await page.goto("/en");

    await expect(footer(page)).toContainText("Starter Site, all rights reserved.");
    await expect(
      footer(page).getByRole("link", { name: "Privacy policy" }),
    ).toHaveAttribute("href", "/en/privacy-policy");
  });
});

test.describe("on every Page", () => {
  test("the not-found page has the Header and Footer in its Locale", async ({ page }) => {
    const response = await page.goto("/en/does-not-exist");

    expect(response?.status()).toBe(404);
    await expect(header(page).getByRole("link", { name: "Articles" })).toBeVisible();
    await expect(footer(page)).toContainText("Starter Site, all rights reserved.");
  });
});

test.describe("language switcher", () => {
  for (const from of ["/hr", "/en"]) {
    test(`on ${from} links to both Homepages`, async ({ page }) => {
      await page.goto(from);

      const switcher = header(page).getByRole("navigation", {
        name: from === "/hr" ? "Odabir jezika" : "Choose language",
      });
      await expect(switcher.getByRole("link", { name: "Hrvatski" })).toHaveAttribute(
        "href",
        "/hr",
      );
      await expect(switcher.getByRole("link", { name: "English" })).toHaveAttribute(
        "href",
        "/en",
      );
    });
  }

  test("switches to Croatian against an English browser without bouncing back", async ({
    page,
  }) => {
    // The browser language is en-US, so a detour through the proxy would end on /en.
    await page.goto("/en");
    await header(page).getByRole("link", { name: "Hrvatski" }).click();

    await expect(page).toHaveURL(/\/hr$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "hr");
  });
});

/** Saves a global the way the admin does: an authenticated REST update. */
async function saveGlobal(
  request: APIRequestContext,
  slug: "header" | "footer",
  locale: Locale,
  data: Record<string, unknown>,
) {
  const response = await request.post(`/api/globals/${slug}?locale=${locale}`, {
    headers: await editorHeaders(request),
    data,
  });
  expect(response.ok()).toBe(true);
}

test.describe("revalidation after an Editor saves", () => {
  test("saving the Header refreshes cached Pages", async ({ page, request }) => {
    // Prime the cache with the seeded Header.
    await page.goto("/en");
    await expect(header(page).getByRole("link", { name: "Articles" })).toBeVisible();

    try {
      await saveGlobal(request, "header", "en", {
        navItems: [{ label: "News", url: "/en/news" }],
      });

      await page.goto("/en");
      await expect(header(page).getByRole("link", { name: "News" })).toHaveAttribute(
        "href",
        "/en/news",
      );
      await expect(header(page).getByRole("link", { name: "Articles" })).toHaveCount(0);

      // The other Locale keeps its own links.
      await page.goto("/hr");
      await expect(header(page).getByRole("link", { name: "Članci" })).toBeVisible();
    } finally {
      await saveGlobal(request, "header", "en", {
        navItems: [{ label: "Articles", url: "/en/articles" }],
      });
    }
  });

  test("saving the Footer refreshes cached Pages", async ({ page, request }) => {
    await page.goto("/hr");
    await expect(footer(page)).toContainText("Starter Site, sva prava pridržana.");

    try {
      await saveGlobal(request, "footer", "hr", { text: "Novi tekst podnožja." });

      await page.goto("/hr");
      await expect(footer(page)).toContainText("Novi tekst podnožja.");
    } finally {
      await saveGlobal(request, "footer", "hr", {
        text: "Starter Site, sva prava pridržana.",
      });
    }
  });
});
