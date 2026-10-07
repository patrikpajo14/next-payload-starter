import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import type { Locale } from "../../lib/i18n/locales";
import { homepageSections, saveSections } from "../helpers/homepage-api";
import type { SectionData } from "../helpers/homepage-api";

// Seeded by tests/helpers/reset-and-seed.ts: after the Hero, one Products
// Slider (three products) and one Solutions Section (two solutions) per Locale.

const seeded: Record<
  Locale,
  {
    products: {
      heading: string;
      titles: string[];
      /** Of the first product. */
      imageAlt: string;
      /** Of the second product. */
      link: { label: string; url: string };
      previous: string;
      next: string;
    };
    solutions: {
      heading: string;
      items: Array<{ title: string; text: string }>;
      imageAlt: string;
      link: { label: string; url: string };
    };
  }
> = {
  hr: {
    products: {
      heading: "Naši proizvodi",
      titles: ["Proizvod Jedan", "Proizvod Dva", "Proizvod Tri"],
      imageAlt: "Zelena slika",
      link: { label: "Saznajte više", url: "/hr/clanci" },
      previous: "Prethodni proizvod",
      next: "Sljedeći proizvod",
    },
    solutions: {
      heading: "Naša rješenja",
      items: [
        { title: "Rješenje A", text: "Za mala poduzeća." },
        { title: "Rješenje B", text: "Za velike timove." },
      ],
      imageAlt: "Zelena slika",
      link: { label: "Pročitajte članke", url: "/hr/clanci" },
    },
  },
  en: {
    products: {
      heading: "Our products",
      titles: ["Product One", "Product Two", "Product Three"],
      imageAlt: "Green image",
      link: { label: "Learn more", url: "/en/articles" },
      previous: "Previous product",
      next: "Next product",
    },
    solutions: {
      heading: "Our solutions",
      items: [
        { title: "Solution A", text: "For small businesses." },
        { title: "Solution B", text: "For large teams." },
      ],
      imageAlt: "Green image",
      link: { label: "Read our articles", url: "/en/articles" },
    },
  },
};

const main = (page: Page) => page.getByRole("main");

/** The Section whose heading is `heading`. */
const sectionNamed = (page: Page, heading: string) =>
  main(page).locator("section", { has: page.getByRole("heading", { name: heading, level: 2 }) });

for (const locale of ["hr", "en"] as const) {
  const { products, solutions } = seeded[locale];

  test(`the Products Slider shows one product at a time on /${locale}`, async ({ page }) => {
    await page.goto(`/${locale}`);
    const slider = main(page).getByRole("region", { name: products.heading });
    const previous = slider.getByRole("button", { name: products.previous });
    const next = slider.getByRole("button", { name: products.next });
    const shownTitle = slider.getByRole("heading", { level: 3 });

    await expect(shownTitle).toHaveText([products.titles[0]]);
    await expect(slider.getByRole("img", { name: products.imageAlt })).toBeVisible();
    await expect(previous).toBeDisabled();

    await next.click();
    await expect(shownTitle).toHaveText([products.titles[1]]);
    await expect(slider.getByRole("img")).toHaveCount(0);
    await expect(slider.getByRole("link", { name: products.link.label })).toHaveAttribute(
      "href",
      products.link.url,
    );
    await expect(previous).toBeEnabled();

    await next.click();
    await expect(shownTitle).toHaveText([products.titles[2]]);
    await expect(next).toBeDisabled();

    await previous.click();
    await expect(shownTitle).toHaveText([products.titles[1]]);
    await expect(next).toBeEnabled();
  });

  test(`the Solutions Section renders its items on /${locale}`, async ({ page }) => {
    await page.goto(`/${locale}`);
    const section = sectionNamed(page, solutions.heading);

    await expect(section.getByRole("heading", { level: 3 })).toHaveText(
      solutions.items.map((item) => item.title),
    );
    for (const item of solutions.items) {
      await expect(section.getByText(item.text)).toBeVisible();
    }
    await expect(section.getByRole("img", { name: solutions.imageAlt })).toBeVisible();
    await expect(section.getByRole("link", { name: solutions.link.label })).toHaveAttribute(
      "href",
      solutions.link.url,
    );
  });
}

test.describe("an Editor filling items in one Locale", () => {
  let seededEn: SectionData[];

  test.beforeEach(async ({ request }) => {
    seededEn = await homepageSections(request, "en");
  });

  test.afterEach(async ({ request }) => {
    await saveSections(request, "en", seededEn);
  });

  test("items without a title, empty fields, and Sections with no items left are skipped", async ({
    page,
    request,
  }) => {
    await saveSections(request, "en", [
      {
        blockType: "productsSlider",
        heading: "Sparse products",
        items: [{ text: "An untitled product" }, { title: "Lone product" }],
      },
      {
        blockType: "productsSlider",
        heading: "Untitled products",
        items: [{ text: "Only text" }],
      },
      {
        blockType: "solutions",
        heading: "Sparse solutions",
        items: [
          { title: "Bare solution" },
          { text: "An untitled solution" },
          { title: "Half a link", link: { label: "Dangling label" } },
        ],
      },
      { blockType: "solutions", heading: "No solutions", items: [] },
    ]);

    const response = await page.goto("/en");

    expect(response?.status()).toBe(200);
    const slider = main(page).getByRole("region", { name: "Sparse products" });
    await expect(slider.getByRole("heading", { level: 3 })).toHaveText(["Lone product"]);
    // One product left: nothing to navigate.
    await expect(slider.getByRole("button")).toHaveCount(0);

    const solutions = sectionNamed(page, "Sparse solutions");
    await expect(solutions.getByRole("heading", { level: 3 })).toHaveText([
      "Bare solution",
      "Half a link",
    ]);
    await expect(solutions.getByRole("img")).toHaveCount(0);
    await expect(solutions.locator("p")).toHaveCount(0);
    await expect(solutions.getByRole("link")).toHaveCount(0);

    await expect(main(page).getByText(/untitled/i)).toHaveCount(0);
    await expect(main(page).getByRole("heading", { name: "Untitled products" })).toHaveCount(0);
    await expect(main(page).getByRole("heading", { name: "No solutions" })).toHaveCount(0);

    // The other Locale keeps its own Sections and items.
    await page.goto("/hr");
    await expect(
      main(page)
        .getByRole("region", { name: seeded.hr.products.heading })
        // Every product, not only the one shown.
        .getByRole("heading", { level: 3, includeHidden: true }),
    ).toHaveText(seeded.hr.products.titles);
    await expect(
      sectionNamed(page, seeded.hr.solutions.heading).getByRole("heading", { level: 3 }),
    ).toHaveText(seeded.hr.solutions.items.map((item) => item.title));
  });
});
