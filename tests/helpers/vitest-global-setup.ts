import { resetAndSeedInSubprocess } from "./reset-in-subprocess";

/**
 * Runs once per `vitest run`, so every run starts from the same seeded database.
 * `SKIP_DB_RESET=1` reuses the database from the last run, to iterate on one
 * spec in seconds. Only for specs that create their own uniquely named data;
 * CI never sets it.
 */
export default function globalSetup(): void {
  if (process.env.SKIP_DB_RESET === "1") return;
  resetAndSeedInSubprocess();
}
