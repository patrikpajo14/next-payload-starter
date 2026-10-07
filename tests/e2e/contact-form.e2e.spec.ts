import { expect, test } from "@playwright/test";

import { signInAsEditor } from "../helpers/admin";

// Seeded by tests/helpers/reset-and-seed.ts: the Contact Page ("kontakt" /
// "contact") has showContactForm on and links the privacy policy Article.

test.describe("Contact Form", () => {
  test("shows only on Articles with showContactForm on", async ({ page }) => {
    await page.goto("/hr/kontakt");
    await expect(page.getByRole("button", { name: "Pošalji" })).toBeVisible();

    await page.goto("/hr/politika-privatnosti");
    await expect(page.getByRole("button", { name: "Pošalji" })).toHaveCount(0);
    await page.goto("/hr/clanci/moj-clanak");
    await expect(page.getByRole("button", { name: "Pošalji" })).toHaveCount(0);
  });

  test("shows validation errors in the Visitor's Locale and keeps typed values", async ({
    page,
  }) => {
    await page.goto("/hr/kontakt");
    await page.getByLabel("Ime", { exact: true }).fill("Ana");
    await page.getByLabel("Telefon").fill("abc");
    await page.getByLabel("Poštanski broj").fill("123");
    await page.getByRole("button", { name: "Pošalji" }).click();

    await expect(page.getByText("Koristite samo znamenke, razmake, + i -.")).toBeVisible();
    await expect(page.getByText("Unesite peteroznamenkasti poštanski broj.")).toBeVisible();
    await expect(page.getByText("Ovo polje je obavezno.").first()).toBeVisible();
    await expect(page.getByLabel("Ime", { exact: true })).toHaveValue("Ana");
    await expect(page.getByLabel("Telefon")).toHaveValue("abc");
    await expect(page.getByLabel("Poštanski broj")).toHaveValue("123");

    await page.goto("/en/contact");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText("This field is required.").first()).toBeVisible();
  });

  test("links the consent checkbox to the privacy policy Article", async ({ page }) => {
    await page.goto("/en/contact");

    const link = page.getByRole("link", { name: "Privacy policy" }).last();
    await expect(link).toHaveAttribute("href", "/en/privacy-policy");
    await expect(page.getByLabel(/I have read and accept/)).toBeVisible();
  });

  test("stores a valid submission with the Locale and confirms", async ({ page }) => {
    await page.goto("/en/contact");
    await page.getByLabel("First name").fill("Marko");
    await page.getByLabel("Last name").fill("Markić-E2E");
    await page.getByLabel("Phone").fill("+385 91 234-5678");
    await page.getByLabel("Address").fill("Ilica 1");
    await page.getByLabel("Postal code").fill("10000");
    await page.getByLabel("Message").fill("Hello from the e2e test");
    await page.getByLabel(/I have read and accept/).check();
    await page.getByRole("button", { name: "Send" }).click();

    await expect(page.getByText("Thank you! Your message has been sent.")).toBeVisible();

    await signInAsEditor(page);
    await page.goto("/admin/collections/contact-submissions");
    await expect(page.getByText("Markić-E2E")).toBeVisible();
    await expect(page.getByText("EN").first()).toBeVisible();
  });

  test("rejects a filled honeypot silently, without storing", async ({ page }) => {
    await page.goto("/en/contact");
    await page.getByLabel("First name").fill("Bot");
    await page.getByLabel("Last name").fill("Botić-HONEYPOT");
    await page.getByLabel("Phone").fill("123");
    await page.getByLabel("Address").fill("Nowhere 1");
    await page.getByLabel("Postal code").fill("10000");
    await page.getByLabel("Message").fill("Buy now");
    await page.getByLabel(/I have read and accept/).check();
    await page.locator('input[name="website"]').fill("http://spam.example", { force: true });
    await page.getByRole("button", { name: "Send" }).click();

    await expect(page.getByText("Thank you! Your message has been sent.")).toBeVisible();

    await signInAsEditor(page);
    await page.goto("/admin/collections/contact-submissions");
    await expect(page.getByText("Botić-HONEYPOT")).toHaveCount(0);
  });

  test("denies the public reading submissions through the API", async ({ request }) => {
    const response = await request.get("/api/contact-submissions");

    expect(response.status()).toBe(403);
  });

  test("allows the public to create a submission through the API", async ({ request }) => {
    const response = await request.post("/api/contact-submissions", {
      data: {
        firstName: "Api",
        lastName: "Test",
        phone: "123",
        address: "Ilica 1",
        postalCode: "10000",
        message: "hi",
        visitorLocale: "hr",
      },
    });

    expect(response.status()).toBe(201);
  });
});
