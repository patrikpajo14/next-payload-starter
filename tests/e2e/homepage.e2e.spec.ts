import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import type { Locale } from "../../lib/i18n/locales";
import { homepageSections, saveSections } from "../helpers/homepage-api";
import type { SectionData } from "../helpers/homepage-api";

// Seeded by tests/helpers/reset-and-seed.ts: per Locale, a Hero Section with
// the blue cover image, a heading, and text, followed by a Products Slider and
// a Solutions Section.

const heroes: Array<{ locale: Locale; heading: string; text: string; alt: string }> = [
  {
    locale: "hr",
    heading: "Dobrodošli na Starter Site",
    text: "Članci i novosti našeg tima.",
    alt: "Plava naslovnica",
  },
  {
    locale: "en",
    heading: "Welcome to Starter Site",
    text: "Articles and news from our team.",
    alt: "Blue cover",
  },
];

const main = (page: Page) => page.getByRole("main");

/** The Section headings on the Page, in order. Items inside Sections have lower-level headings. */
const sectionHeadings = (page: Page) =>
  main(page).locator("section").getByRole("heading", { level: 2 }).allTextContents();

for (const hero of heroes) {
  test(`the Hero Section renders its image and text on /${hero.locale}`, async ({ page }) => {
    const response = await page.goto(`/${hero.locale}`);

    expect(response?.status()).toBe(200);
    await expect(main(page).getByRole("heading", { name: hero.heading })).toBeVisible();
    await expect(main(page).getByText(hero.text)).toBeVisible();
    await expect(main(page).getByRole("img", { name: hero.alt })).toBeVisible();
  });
}

const heroSection = (heading: string, text?: string): SectionData => ({
  blockType: "hero",
  heading,
  text,
});

test.describe("an Editor managing Hero Sections", () => {
  let seeded: SectionData[];

  test.beforeEach(async ({ request }) => {
    seeded = await homepageSections(request, "en");
  });

  test.afterEach(async ({ request }) => {
    await saveSections(request, "en", seeded);
  });

  test("adds, repeats, reorders, and removes them, in one Locale only", async ({
    page,
    request,
  }) => {
    await page.goto("/en");
    expect(await sectionHeadings(page)).toEqual([
      "Welcome to Starter Site",
      "Our products",
      "Our solutions",
      "Frequently asked questions",
    ]);

    await saveSections(request, "en", [
      ...seeded,
      heroSection("Second hero"),
      heroSection("Third hero"),
    ]);
    await page.goto("/en");
    expect(await sectionHeadings(page)).toEqual([
      "Welcome to Starter Site",
      "Our products",
      "Our solutions",
      "Frequently asked questions",
      "Second hero",
      "Third hero",
    ]);

    await saveSections(request, "en", [
      heroSection("Third hero"),
      ...seeded,
      heroSection("Second hero"),
    ]);
    await page.goto("/en");
    expect(await sectionHeadings(page)).toEqual([
      "Third hero",
      "Welcome to Starter Site",
      "Our products",
      "Our solutions",
      "Frequently asked questions",
      "Second hero",
    ]);

    await saveSections(request, "en", [heroSection("Third hero")]);
    await page.goto("/en");
    expect(await sectionHeadings(page)).toEqual(["Third hero"]);

    // The other Locale keeps its own Sections.
    await page.goto("/hr");
    expect(await sectionHeadings(page)).toEqual([
      "Dobrodošli na Starter Site",
      "Naši proizvodi",
      "Naša rješenja",
      "Česta pitanja",
    ]);
  });

  test("saving the Homepage refreshes every cached Page", async ({ request }) => {
    // Twice: the first request may render, the second must come from the cache.
    await request.get("/en/articles");
    expect((await request.get("/en/articles")).headers()["x-nextjs-cache"]).toBe("HIT");

    await saveSections(request, "en", [...seeded, heroSection("Fresh hero")]);

    expect((await request.get("/en/articles")).headers()["x-nextjs-cache"]).not.toBe("HIT");
  });
});

const footers: Record<Locale, string> = {
  hr: "Starter Site, sva prava pridržana.",
  en: "Starter Site, all rights reserved.",
};

for (const locale of ["hr", "en"] as const) {
  test.describe(`empty content on /${locale}`, () => {
    let seeded: SectionData[];

    test.beforeEach(async ({ request }) => {
      seeded = await homepageSections(request, locale);
    });

    test.afterEach(async ({ request }) => {
      await saveSections(request, locale, seeded);
    });

    test("empty Sections and fields are skipped without breaking the Page", async ({
      page,
      request,
    }) => {
      await saveSections(request, locale, [{ blockType: "hero" }, heroSection("Only a heading")]);

      const response = await page.goto(`/${locale}`);

      expect(response?.status()).toBe(200);
      await expect(main(page).locator("section")).toHaveCount(1);
      await expect(main(page).getByRole("heading", { name: "Only a heading" })).toBeVisible();
      await expect(main(page).getByRole("img")).toHaveCount(0);
      await expect(main(page).locator("section p")).toHaveCount(0);
    });

    test("a Locale with no Sections still renders the Page", async ({ page, request }) => {
      await saveSections(request, locale, []);

      const response = await page.goto(`/${locale}`);

      expect(response?.status()).toBe(200);
      await expect(main(page).locator("section")).toHaveCount(0);
      await expect(page.getByRole("contentinfo")).toContainText(footers[locale]);
    });
  });
}
