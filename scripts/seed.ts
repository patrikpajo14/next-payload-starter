// Fills an empty database with the starter content: the first Editor, the
// Articles Category, a nameless Category with the privacy policy and the Contact
// Page, a Homepage with one of each Section, and sample Articles, in both Locales.
//
//   SEED_EDITOR_EMAIL=you@example.com SEED_EDITOR_PASSWORD=... pnpm seed
//
// Refuses to run when the database already has an Editor, so it cannot
// overwrite real content.
import config from "@payload-config";
import { getPayload } from "payload";

import { seedContent, seedSampleArticles } from "../seed/content";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`${name} is not set. See "Seed data" in the README.`);
    process.exit(1);
  }
  return value;
}

const email = requiredEnv("SEED_EDITOR_EMAIL");
const password = requiredEnv("SEED_EDITOR_PASSWORD");

const payload = await getPayload({ config });

const { totalDocs } = await payload.count({ collection: "users", overrideAccess: true });
if (totalDocs > 0) {
  console.error("The database already has an Editor. Seed an empty Neon branch instead.");
  process.exit(1);
}

const { articlesCategoryId } = await seedContent(payload);
await seedSampleArticles(payload, articlesCategoryId);
// Last, so a run that fails midway leaves no Editor and the guard above lets a retry through.
await payload.create({ collection: "users", data: { email, password }, overrideAccess: true });

console.log(`Seeded. Sign in at /admin as ${email}.`);
process.exit(0);
