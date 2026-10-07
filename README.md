# Starter Site

A bilingual (Croatian, English) marketing and articles website built with Next.js and Payload CMS. Editors change every piece of content in the CMS admin. See `GLOSSARY.md` for the terms used here and `docs/specs/starter-site.md` for the spec.

## Requirements

- Node.js 20 or newer
- [pnpm](https://pnpm.io)
- A [Neon](https://neon.tech) Postgres project

## Run it locally

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create the database. In the Neon console, create a **branch** for development (for example `dev`) and copy its pooled connection string. Use one Neon branch per environment: development, tests, production. Never share one.

3. Copy `.env.example` to `.env` and fill in the variables below.

4. Seed it (see [Seed data](#seed-data)), then start the dev server:

   ```bash
   pnpm dev
   ```

   The site is at <http://localhost:3000> and the CMS admin at <http://localhost:3000/admin>. Payload creates the database tables on first start. `next build` also reads `DATABASE_URL`, because it prerenders Pages from the database, so set it wherever you build.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Pooled Neon connection string of this environment's branch, such as `postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=verify-full` |
| `PAYLOAD_SECRET` | yes | Long random string that signs sessions. Generate with `openssl rand -hex 32` |
| `S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | production | S3-compatible storage (Cloudflare R2) for uploads. Leave `S3_BUCKET` empty in development and uploads go to `./media`. Set all four or none: a partial setup refuses to start |
| `S3_REGION` | no | Defaults to `auto`, which R2 expects |

The seed script also reads `SEED_EDITOR_EMAIL` and `SEED_EDITOR_PASSWORD`, and the tests read the variables in the [Tests](#tests) section. `.env.example` lists them all.

## Seed data

A fresh database has no content and no Editor. The seed script fills it with:

- the first **Editor**, from `SEED_EDITOR_EMAIL` and `SEED_EDITOR_PASSWORD`
- the **Articles** Category (`/hr/clanci`, `/en/articles`) with sample Articles
- a Category without an SEO Name holding the privacy policy and the **Contact Page** (`/hr/kontakt`, `/en/contact`)
- a **Homepage** with one of each Section: Hero, Products Slider, Solutions, FAQ, Banner
- the Header and Footer links

Everything is created in both Locales.

```bash
SEED_EDITOR_EMAIL=you@example.com SEED_EDITOR_PASSWORD='choose-a-password' pnpm seed
```

The script creates the Editor last and refuses to run when the database already has one, so it cannot overwrite real content. A run that fails midway leaves no Editor: clear the half-seeded content (or use a new branch) and run it again. To start over, point `DATABASE_URL` at a new, empty Neon branch (or reset the branch in the Neon console) and run it again.

After seeding, a fresh clone shows the Homepage at `/hr` and `/en`, the Article List at `/hr/clanci`, an Article page, and the Contact Page with its form.

The test database is seeded from the same content (`seed/content.ts`), plus a few extra fixtures that only tests need.

## Tests

Tests run against their own Neon branch. **Every run deletes all data in it**, and the run refuses to start if the branch looks like development or production.

1. Create a dedicated Neon branch for tests.
2. Copy the test section of `.env.example` to `.env.test` (git-ignored) and set `TEST_DATABASE_URL`, `TEST_EDITOR_EMAIL` and `TEST_EDITOR_PASSWORD`.
3. Run:

   ```bash
   pnpm test:int   # Vitest against the Local API
   pnpm test:e2e   # Playwright against a built app
   pnpm test       # both
   ```

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm seed` | Fill an empty database with starter content |
| `pnpm typecheck` | Generate route types and run `tsc` |
| `pnpm generate:types` | Regenerate `payload-types.ts` after changing a collection or global |
| `pnpm lint` | ESLint |
