// Run with: pnpm payload run tests/helpers/reset-and-seed.script.ts
// The caller must already point DATABASE_URL at the test database.
import config from "@payload-config";
import { getPayload } from "payload";

import { resetDatabase, seedBase } from "./reset-and-seed";

// Reset first: Payload pushes its schema while it initialises.
await resetDatabase();
const payload = await getPayload({ config });
await seedBase(payload);
console.log("Test database reset and seeded.");
process.exit(0);
