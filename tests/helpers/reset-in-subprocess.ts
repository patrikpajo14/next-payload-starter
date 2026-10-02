import { spawnSync } from "node:child_process";

import { loadTestEnv } from "./test-env";

/**
 * Resets and reseeds the test database in a child process, so the calling test
 * runner never initialises Payload itself (its logger would keep the runner
 * from exiting).
 */
export function resetAndSeedInSubprocess(): void {
  const env = loadTestEnv();
  const result = spawnSync(
    "pnpm",
    ["payload", "run", "tests/helpers/reset-and-seed.script.ts"],
    { env: { ...process.env, ...env }, stdio: "inherit" },
  );
  if (result.status !== 0) {
    throw new Error("Resetting and seeding the test database failed.");
  }
}
