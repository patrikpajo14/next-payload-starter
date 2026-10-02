import { expect, test } from "@playwright/test";

import { requiredEnv } from "../helpers/test-env";

const email = requiredEnv("TEST_EDITOR_EMAIL");
const password = requiredEnv("TEST_EDITOR_PASSWORD");

test("the site responds", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
});

test("the seeded Editor can sign in to the admin", async ({ page }) => {
  await page.goto("/admin/login");

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Collections" })).toBeVisible();
});
