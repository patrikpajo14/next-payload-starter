import { expect, test } from "@playwright/test";

import { signInAsEditor } from "../helpers/admin";

test("the site responds", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
});

test("the seeded Editor can sign in to the admin", async ({ page }) => {
  await signInAsEditor(page);

  await expect(page.getByRole("heading", { name: "Collections" })).toBeVisible();
});
