import { resetAndSeedInSubprocess } from "../helpers/reset-in-subprocess";

/** Resets and reseeds the test database once per Playwright run. */
export default function globalSetup(): void {
  resetAndSeedInSubprocess();
}
