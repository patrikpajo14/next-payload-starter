// Run with: pnpm payload run tests/helpers/reset-and-seed.script.ts
// The caller must already point DATABASE_URL at the test database.
import config from "@payload-config";
import { getPayload } from "payload";

import { resetAndSeed } from "./reset-and-seed";

const payload = await getPayload({ config });
await resetAndSeed(payload);
console.log("Test database reset and seeded.");
process.exit(0);
