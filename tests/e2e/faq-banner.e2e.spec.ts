import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import type { Locale } from "../../lib/i18n/locales";
import { homepageSections, saveSections } from "../helpers/homepage-api";
import type { SectionData } from "../helpers/homepage-api";

// Seeded by tests/helpers/reset-and-seed.ts: after the Solutions Section, a FAQ
// of two questions and a Banner linking to the Contact Page, per Locale.

const seeded: Record<
  Locale,
  {
    faq: {
      heading: string;
      items: Array<{ question: string; answer: string }>;
    };
    banner: {
      text: string;
      imageAlt: string;
      cta: { label: string; url: string };
      contactTitle: string;
    };
  }
> = {
  hr: {
    faq: {
      heading: "Česta pitanja",
      items: [
        {
          question: "Što je Starter Site?",
          answer: "Početni predložak web-stranice.",
        },
        {
          question: "Tko uređuje sadržaj?",
          answer: "Urednici u administraciji.",
        },
      ],
    },
    banner: {
      text: "Imate pitanje? Javite nam se.",
      imageAlt: "Zelena slika",
      cta: { label: "Kontaktirajte nas", url: "/hr/kontakt" },
      contactTitle: "Kontakt",
    },
  },
  en: {
    faq: {
      heading: "Frequently asked questions",
      items: [
        {
          question: "What is Starter Site?",
          answer: "A starter template for websites.",
        },
        { question: "Who edits the content?", answer: "Editors in the admin." },
      ],
    },
    banner: {
      text: "Have a question? Get in touch.",
      imageAlt: "Green image",
      cta: { label: "Contact us", url: "/en/contact" },
      contactTitle: "Contact",
    },
  },
};

const main = (page: Page) => page.getByRole("main");

/** The Section whose heading is `heading`. */
const sectionNamed = (page: Page, heading: string) =>
  main(page).locator("section", {
    has: page.getByRole("heading", { name: heading, level: 2 }),
  });

for (const locale of ["hr", "en"] as const) {
  const { faq, banner } = seeded[locale];

  test(`FAQ answers expand and collapse on /${locale}`, async ({ page }) => {
    await page.goto(`/${locale}`);
    const section = sectionNamed(page, faq.heading);

    for (const item of faq.items) {
      const question = section.getByText(item.question, { exact: true });
      const answer = section.getByText(item.answer, { exact: true });
      await expect(question).toBeVisible();
      await expect(answer).toBeHidden();

      await question.click();
      await expect(answer).toBeVisible();

      await question.click();
      await expect(answer).toBeHidden();
    }
  });

  test(`FAQ questions open from the keyboard on /${locale}`, async ({ page }) => {
    await page.goto(`/${locale}`);
    const section = sectionNamed(page, faq.heading);
    const [first] = faq.items;

    await section.getByText(first.question, { exact: true }).focus();
    await page.keyboard.press("Enter");

    await expect(section.getByText(first.answer, { exact: true })).toBeVisible();
  });

  test(`the Banner renders and its CTA opens the Contact Page on /${locale}`, async ({ page }) => {
    await page.goto(`/${locale}`);
    const section = main(page).locator("section", { hasText: banner.text });

    await expect(section.getByRole("img", { name: banner.imageAlt })).toBeVisible();
    const cta = section.getByRole("link", { name: banner.cta.label });
    await expect(cta).toHaveAttribute("href", banner.cta.url);

    await cta.click();

    await expect(page).toHaveURL(banner.cta.url);
    await expect(page.getByRole("heading", { level: 1, name: banner.contactTitle })).toBeVisible();
  });
}

test.describe("an Editor filling FAQ and Banner in one Locale", () => {
  let seededEn: SectionData[];

  test.beforeEach(async ({ request }) => {
    seededEn = await homepageSections(request, "en");
  });

  test.afterEach(async ({ request }) => {
    await saveSections(request, "en", seededEn);
  });

  test("incomplete items, half a CTA, and emptied Sections are skipped", async ({
    page,
    request,
  }) => {
    await saveSections(request, "en", [
      {
        blockType: "faq",
        heading: "Sparse FAQ",
        items: [
          { question: "Complete?", answer: "Yes." },
          { question: "No answer" },
          { answer: "No question" },
        ],
      },
      {
        blockType: "faq",
        heading: "Empty FAQ",
        items: [{ question: "Only a question" }],
      },
      {
        blockType: "banner",
        text: "Half a CTA",
        cta: { label: "Dangling label" },
      },
      { blockType: "banner", cta: {} },
    ]);

    const response = await page.goto("/en");

    expect(response?.status()).toBe(200);
    const faq = sectionNamed(page, "Sparse FAQ");
    await expect(faq.locator("summary")).toHaveText(["Complete?"]);
    await expect(main(page).getByText(/no answer|no question|only a question/i)).toHaveCount(0);
    await expect(main(page).getByRole("heading", { name: "Empty FAQ" })).toHaveCount(0);

    const banner = main(page).locator("section", { hasText: "Half a CTA" });
    await expect(banner.getByRole("link")).toHaveCount(0);
    await expect(main(page).locator("section")).toHaveCount(2);

    // The other Locale keeps its own Sections.
    await page.goto("/hr");
    await expect(sectionNamed(page, seeded.hr.faq.heading)).toBeVisible();
  });
});
