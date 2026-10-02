import { resetAndSeedInSubprocess } from "./reset-in-subprocess";

/** Runs once per `vitest run`, so every run starts from the same seeded database. */
export default function globalSetup(): void {
  resetAndSeedInSubprocess();
}
