import { defineConfig, devices } from "@playwright/test";

import { loadTestEnv } from "./tests/helpers/test-env";

const PORT = 3100;
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
      name: "chromium",
      // The installed Chrome avoids a separate browser download.
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
  webServer: {
    // Reset and seed before building: Playwright starts the web server before
    // any globalSetup, and the build prerenders Pages from the database.
    command: `pnpm payload run tests/helpers/reset-and-seed.script.ts && pnpm build && pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 300_000,
    env,
  },
});
