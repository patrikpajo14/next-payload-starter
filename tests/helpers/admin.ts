import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

import { requiredEnv } from "./test-env";

/** Signs in to the admin as the seeded Editor and waits for the dashboard. */
export async function signInAsEditor(page: Page): Promise<void> {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(requiredEnv("TEST_EDITOR_EMAIL"));
  await page.getByLabel("Password").fill(requiredEnv("TEST_EDITOR_PASSWORD"));
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}
