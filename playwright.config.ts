import { defineConfig, devices } from "@playwright/test";

import { loadTestEnv } from "./tests/helpers/test-env";

// Override with E2E_PORT when another local app already uses 3100.
const PORT = Number(process.env.E2E_PORT ?? 3100);
const env = loadTestEnv();

// Tests run against a production build, not the dev server, on their own port
// so a running `pnpm dev` is never reused or disturbed.
export default defineConfig({
  testDir: "./tests/e2e",
  // One shared database: never run tests at the same time.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "en-US",
    trace: "on-first-retry",
  },
  projects: [
    {
      // Must see the build's output before any test saves content.
      name: "static-generation",
      testMatch: /static-generation\.e2e\.spec\.ts/,
    },
    {
      name: "chromium",
      testIgnore: /static-generation\.e2e\.spec\.ts/,
      dependencies: ["static-generation"],
      // The installed Chrome avoids a separate browser download.
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
  webServer: {
    // Reset and seed before building: Playwright starts the web server before
    // any globalSetup, and the build prerenders Pages from the database.
    // Next's data cache (unstable_cache) survives `next build`, so clear it too,
    // or a run would serve data cached from the previous run's database.
    command: `pnpm payload run tests/helpers/reset-and-seed.script.ts && rm -rf .next/cache/fetch-cache && pnpm build && pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 300_000,
    env,
  },
});
