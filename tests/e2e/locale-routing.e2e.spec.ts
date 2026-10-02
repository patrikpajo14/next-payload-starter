import { expect, test } from "@playwright/test";

/** The Location header may be relative or absolute; compare its path and query only. */
const locationOf = (headers: Record<string, string>) =>
  new URL(headers.location, "http://localhost");

test.describe("locale redirect from /", () => {
  const cases: Array<[string, string | undefined, string]> = [
    ["a Croatian browser", "hr-HR,hr;q=0.9,en;q=0.5", "/hr"],
    ["an English browser", "en-US,en;q=0.9", "/en"],
    ["an unsupported language", "de-DE,de;q=0.9", "/hr"],
    ["no Accept-Language header", undefined, "/hr"],
    ["a weighted preference for Croatian", "en;q=0.5,hr;q=0.9", "/hr"],
    ["a weighted preference for English", "hr;q=0.4,en;q=0.9", "/en"],
  ];

  for (const [label, acceptLanguage, expected] of cases) {
    test(`sends ${label} to ${expected}`, async ({ request }) => {
      const response = await request.get("/", {
        headers: acceptLanguage ? { "accept-language": acceptLanguage } : {},
        maxRedirects: 0,
      });

      expect(response.status()).toBe(307);
      expect(locationOf(response.headers()).pathname).toBe(expected);
    });
  }

  test("keeps the rest of the path and the query string", async ({ request }) => {
    const response = await request.get("/some/path?x=1", {
      headers: { "accept-language": "en" },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(307);
    const location = locationOf(response.headers());
    expect(location.pathname).toBe("/en/some/path");
    expect(location.search).toBe("?x=1");
  });
});

test.describe("site shell", () => {
  test("/hr renders in Croatian", async ({ page }) => {
    const response = await page.goto("/hr");

    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "hr");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Dobrodošli");
  });

  test("/en renders in English", async ({ page }) => {
    const response = await page.goto("/en");

    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome");
  });
});

test.describe("localized not-found page", () => {
  test("an unknown Croatian path is a 404 in Croatian", async ({ page }) => {
    const response = await page.goto("/hr/does-not-exist");

    expect(response?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", "hr");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Stranica nije pronađena",
    );
  });

  test("an unknown English path is a 404 in English", async ({ page }) => {
    const response = await page.goto("/en/does-not-exist/deeper/still");

    expect(response?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
  });

  test("an unprefixed unknown path is sent to the default Locale and 404s", async ({
    page,
  }) => {
    const response = await page.goto("/nothing-here");

    expect(page.url()).toMatch(/\/en\/nothing-here$/); // browser language is en-US
    expect(response?.status()).toBe(404);
  });

  test("an unsupported locale prefix is a 404", async ({ page }) => {
    const response = await page.goto("/fr/anything");

    expect(response?.status()).toBe(404);
  });
});

test.describe("paths outside locale handling", () => {
  test("the admin is not prefixed with a Locale", async ({ page }) => {
    await page.goto("/admin");

    expect(new URL(page.url()).pathname).toMatch(/^\/admin(\/|$)/);
  });

  test("the API is not redirected", async ({ request }) => {
    const response = await request.get("/api/users/init", { maxRedirects: 0 });

    expect(response.status()).toBe(200);
    expect(await response.json()).toHaveProperty("initialized");
  });

  test("static files are not redirected", async ({ request }) => {
    const response = await request.get("/favicon.ico", { maxRedirects: 0 });

    expect(response.status()).toBe(200);
  });
});
