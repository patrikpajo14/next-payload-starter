import { expect, test } from "@playwright/test";

// Runs as its own Playwright project before every other test (see
// playwright.config.ts): other tests publish and save content, which expires
// cached Pages, so only a first request straight after the build proves a Page
// was generated at build time.

for (const path of ["/hr/politika-privatnosti", "/hr/clanci/moj-clanak"]) {
  test(`${path} is generated at build time`, async ({ request }) => {
    const response = await request.get(path);

    expect(response.status()).toBe(200);
    expect(response.headers()["x-nextjs-cache"]).toBe("HIT");
  });
}
