import { expect, test } from "@playwright/test";
import sharp from "sharp";

import { signInAsEditor } from "../helpers/admin";

/** A real 1200×800 PNG, so Payload has something to resize. */
const testImage = () =>
  sharp({
    create: { width: 1200, height: 800, channels: 3, background: "#3366cc" },
  })
    .png()
    .toBuffer();

test("an Editor uploads an image in the admin and Visitors can load it", async ({
  page,
  playwright,
  baseURL,
}) => {
  await signInAsEditor(page);

  await page.goto("/admin/collections/media/create");
  await page.locator('input[type="file"]').setInputFiles({
    name: "e2e-upload.png",
    mimeType: "image/png",
    buffer: await testImage(),
  });
  await page.getByRole("textbox", { name: /^Alt/ }).fill("Plavi pravokutnik");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/admin\/collections\/media\/\d+/);
  const id = page.url().match(/\/media\/(\d+)/)![1];

  // A Visitor: a fresh request context with no Editor session.
  const visitor = await playwright.request.newContext({ baseURL });
  const doc = await (await visitor.get(`/api/media/${id}`)).json();

  const original = await visitor.get(doc.url);
  expect(original.status()).toBe(200);
  expect(original.headers()["content-type"]).toBe("image/png");

  // Resizing proves image processing works.
  expect(doc.sizes.card).toMatchObject({ width: 768 });
  const card = await visitor.get(doc.sizes.card.url);
  expect(card.status()).toBe(200);
  const { width } = await sharp(await card.body()).metadata();
  expect(width).toBe(768);

  await visitor.dispose();
});
