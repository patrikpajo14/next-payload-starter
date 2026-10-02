import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

import { loadTestEnv } from "./tests/helpers/test-env";

// Evaluated in the main process, before any test worker starts.
const env = loadTestEnv();

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/int/**/*.int.spec.ts"],
    globalSetup: ["./tests/helpers/vitest-global-setup.ts"],
    env,
    // One shared database: never run test files at the same time.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
