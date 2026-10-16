import { expect, test } from "@playwright/test";

import { signInAsEditor } from "../helpers/admin";
import { editorHeaders } from "../helpers/editor-api";
import { homepageSections, saveDraftSections, saveSections } from "../helpers/homepage-api";
import type { SectionData } from "../helpers/homepage-api";

const PUBLISHED = "Welcome to Starter Site";
const hero = (heading: string): SectionData => ({ blockType: "hero", heading });

test.describe("Homepage Live Preview", () => {
  let seeded: SectionData[];

  test.beforeEach(async ({ request }) => {
    seeded = await homepageSections(request, "en");
  });

  // Publishing the seeded Sections again also replaces any Draft.
  test.afterEach(async ({ request }) => {
    await saveSections(request, "en", seeded);
    // Opening the admin in English stores English as the Editor's admin Locale,
    // and later admin specs would then type their titles into English fields.
    const reset = await request.post("/api/payload-preferences/locale", {
      headers: await editorHeaders(request),
      data: { value: "hr" },
    });
    expect(reset.ok()).toBe(true);
  });

  test("refuses Draft Mode to a Visitor", async ({ playwright, baseURL }) => {
    // A fresh context: the shared `request` keeps the Editor's sign-in cookie.
    const visitor = await playwright.request.newContext({ baseURL });
    const response = await visitor.get("/api/preview?locale=en", { maxRedirects: 0 });

    expect(response.status()).toBe(401);
    expect(response.headers()["set-cookie"] ?? "").not.toContain("__prerender_bypass");
    await visitor.dispose();
  });

  test("shows a saved Draft to the Editor and never to a Visitor", async ({
    browser,
    page,
    request,
  }) => {
    await saveDraftSections(request, "en", [hero("Draft hero"), ...seeded.slice(1)]);

    await signInAsEditor(page);
    const preview = await page.goto("/api/preview?locale=en");
    expect(page.url()).toMatch(/\/en$/);
    expect(preview?.headers()["cache-control"]).toContain("no-store");
    await expect(page.getByRole("heading", { name: "Draft hero" })).toBeVisible();
    await expect(page.getByRole("status")).toContainText("Draft preview");

    // A Visitor right after the preview: the Draft did not land in any cache.
    const visitor = await browser.newPage();
    await visitor.goto("/en");
    await expect(visitor.getByRole("heading", { name: PUBLISHED })).toBeVisible();
    await expect(visitor.getByRole("heading", { name: "Draft hero" })).toHaveCount(0);
    await visitor.close();

    // Leaving the preview shows the published Homepage again.
    await page.getByRole("button", { name: "Exit preview" }).click();
    await expect(page.getByRole("heading", { name: PUBLISHED })).toBeVisible();
  });

  test("updates the admin's preview pane when the Editor saves a Draft", async ({ page }) => {
    await signInAsEditor(page);
    await page.goto("/admin/globals/homepage?locale=en");
    await page.getByRole("button", { name: "Live Preview" }).click();
    const pane = page.frameLocator("#live-preview-iframe");
    await expect(pane.getByRole("heading", { name: PUBLISHED })).toBeVisible();

    await page.locator("#field-sections__0__heading").fill("Edited in the admin");
    await page.getByRole("button", { name: "Save Draft" }).click();

    // Save, then a server render of the Page: slower than one assertion's default wait.
    await expect(pane.getByRole("heading", { name: "Edited in the admin" })).toBeVisible({
      timeout: 20_000,
    });
  });
});
