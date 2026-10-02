# Payload CMS with current Next.js

Researched 2026-10-02. Sources are primary only: payloadcms.com/docs, the payloadcms/payload GitHub repo, and the packages already installed in `node_modules` (which are the source of truth for this repo). Fetched doc pages were summarized by a fetch tool, so verify code snippets against the linked page before copying them.

## Version pin

| Item | Value | Source |
|---|---|---|
| Payload researched / installed | `3.90.2` (latest release tag `v3.90.2`, 2026-09-23, "no breaking changes noted") | https://api.github.com/repos/payloadcms/payload/releases/latest ; `node_modules/payload/package.json` |
| Repo Next / React | `next 16.3.8`, `react 19.2.8` | `/package.json` |
| Next range `@payloadcms/next@3.90.2` accepts | `>=15.2.9 <15.3.0 \|\| >=15.3.9 <15.4.0 \|\| >=15.4.11 <15.5.0 \|\| >=16.3.3 <17.0.0` | `node_modules/@payloadcms/next/package.json` (peerDependencies) |
| Match? | Yes. 16.3.8 is inside `>=16.3.3 <17`. | |
| Node | `>=20.9.0` (docs); `@payloadcms/next` engines `^18.20.2 \|\| >=20.9.0` | https://payloadcms.com/docs/getting-started/installation ; package.json above |
| Payload `main` branch | `4.0.0-canary.37`, uses Next 16.3.8. Do not use for a template; stay on 3.x. | https://raw.githubusercontent.com/payloadcms/payload/main/package.json |

Note: the install docs page lists "16.2.6+" as supported for Next 16, but the 3.90.2 peer range is `>=16.3.3`. Trust the peer range (the page may be ahead of or behind the package). `withPayload` also logs a warning for Next 16 versions that lack the `turbopackServerFastRefresh` option (`node_modules/@payloadcms/next/dist/withPayload/withPayload.js`).

Repo state (uncommitted `git diff`): `package.json` already adds `payload`, `@payloadcms/next`, `@payloadcms/db-postgres` (all `^3.90.2`) and `sharp`; `pnpm-workspace.yaml` adds `esbuild: true` to `allowBuilds`. Not yet present: `@payloadcms/richtext-lexical`, `@payloadcms/ui` (pulled in transitively by `@payloadcms/next`, which depends on `@payloadcms/ui` 3.90.2, `@payloadcms/graphql`, `graphql-http`), a direct `graphql` dep (resolved as `graphql@16.14.2` via peers), `payload.config.ts`, and the `(payload)` route group. The repo's `app/` currently holds only `layout.tsx`, `page.tsx`, `globals.css`. Next config is `next.config.ts` (not wrapped yet).

## Summary and recommendations

1. **Install into the existing Next app** (manual install), do not run create-payload-app. The repo already has the deps added and the docs support this path. Copy the `(payload)` folder from the blank template and move the current frontend into a `(frontend)` route group. Pin every `@payloadcms/*` package and `payload` to the same exact version (peer is exact: `"payload": "3.90.2"`), and add `@payloadcms/richtext-lexical` at `3.90.2` too.
2. **Use the Local API (`getPayload`) in Server Components** for all reads (homepage sections, articles list/detail, header/footer). No HTTP hop, typed, HMR-aware. Reserve REST for the browser contact form (or use a Server Action calling `payload.create`). GraphQL is unnecessary and can be disabled with `graphql.disable: true`.
3. **Model**: Globals `header` and `footer`; a Global (or a `pages` collection with a blocks field) for the homepage's 4 sections; collections `articles` (with `slug`, Lexical `content`, `_status` drafts), `media` (uploads), `users` (admin auth), and `contact-submissions` (public `create` access only; read restricted to authenticated users). Alternative to the hand-rolled submission collection: the official Form Builder plugin.
4. **Postgres**: `@payloadcms/db-postgres` with `pool.connectionString`. Dev uses Drizzle push automatically; switch to committed migrations (`payload migrate:create`, `payload migrate`) before first production deploy and do not mix the two against the same DB.
5. **Lexical**: configure `editor: lexicalEditor()` at root; render with `<RichText data={...} />` from `@payloadcms/richtext-lexical/react` in Server Components.
6. Compatibility with the repo's Next/React is fine on paper. Open risk: verify `cacheComponents` is off (see Gotchas) and run a real `pnpm build` after setup.

## Install method

Two documented methods (https://payloadcms.com/docs/getting-started/installation):

- `npx create-payload-app` for a new project, or
- manual add to an existing Next.js app. The page states Next must be one of `15.2.9-15.2.x`, `15.3.9-15.3.x`, `15.4.11-15.4.x`, `16.2.6+`; Node 20.9.0+; "pnpm preferred".

Manual steps from the same page:

```bash
pnpm i payload @payloadcms/next
pnpm i @payloadcms/db-postgres          # one DB adapter (docs example shows db-mongodb)
pnpm i @payloadcms/richtext-lexical     # rich text
```

`next.config` (docs show `.mjs`; ESM required, either `"type": "module"` or `.mjs`). The official blank template uses `next.config.ts` wrapped with `withPayload` (https://raw.githubusercontent.com/payloadcms/payload/main/templates/blank/next.config.ts), so this repo's `next.config.ts` is fine:

```js
import { withPayload } from '@payloadcms/next/withPayload'
const nextConfig = { /* your Next config */ }
export default withPayload(nextConfig)
```

`tsconfig.json` path alias (docs). Blank template maps it to `./src/payload.config.ts`; this repo has no `src/` and maps `@/*` to `./*`, so use `./payload.config.ts`:

```json
{ "compilerOptions": { "paths": { "@payload-config": ["./payload.config.ts"] } } }
```

Config skeleton from the docs, adapted to Postgres per https://payloadcms.com/docs/database/postgres:

```ts
import sharp from 'sharp'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig } from 'payload'

export default buildConfig({
  editor: lexicalEditor(),
  collections: [],
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL } }),
  sharp,
})
```

App folder structure: `app/(payload)/` (Payload files) and `app/(frontend)/` (your files); "Copy the `(payload)` folder structure from the Blank Template" and move your root layout into your own route group. The `(payload)` group contents in the blank template (https://github.com/payloadcms/payload/tree/main/templates/blank/src/app/(payload)): `layout.tsx` (uses `RootLayout`, `handleServerFunctions`, `generatePayloadViewport` from `@payloadcms/next/layouts`), `custom.css`, `admin/[[...segments]]/page.tsx` (`RootPage`, `generatePageMetadata`), `api/[...slug]/route.ts` (exports `GET/POST/DELETE/PATCH/PUT/OPTIONS` via `@payloadcms/next/routes`). Files are marked auto-generated and "do not regenerate". Because both `(payload)` and `(frontend)` need their own `<html>`, the repo's current root `app/layout.tsx` must move into `(frontend)`.

Admin is served at `http://localhost:3000/admin`.

pnpm notes:
- Blank template declares `engines.node >=24.15.0`, `pnpm ^9 || ^10 || ^11` and `pnpm.onlyBuiltDependencies: [sharp, esbuild, unrs-resolver]` (https://raw.githubusercontent.com/payloadcms/payload/main/templates/blank/package.json). In this repo `pnpm-workspace.yaml` has `allowBuilds: sharp: false`, which would skip sharp's build script, and `esbuild: true` was just added. Decide whether sharp (image resizing for the Media collection) is needed; if so set `sharp: true`. `packageManager` is `pnpm@12.3.4`, newer than the template's stated ^9-^11 range, worth testing.
- `withPayload` externalizes `graphql` to avoid a "only one instance of graphql" error, so keep a single `graphql` copy (currently `16.14.2`, peer `^16.8.1`).

Typegen / import map scripts (blank template `package.json`): `generate:importmap`, `generate:types`, `payload` (CLI). Add equivalents: `"payload": "payload"`, `"generate:types": "payload generate:types"`, `"generate:importmap": "payload generate:importmap"` (https://payloadcms.com/docs/typescript/overview).

## Local API vs REST vs GraphQL

- **Local API**: https://payloadcms.com/docs/local-api/overview

  ```ts
  import { getPayload } from 'payload'
  import config from '@payload-config'
  const payload = await getPayload({ config })
  const posts = await payload.find({ collection: 'posts', limit: 10 })
  ```

  Direct DB access on the server, no network hop; works with HMR; types inferred from generated types. By default access control is OFF in the Local API; pass `overrideAccess: false` plus a `user` to enforce it. For public pages reading published content only, either set `overrideAccess: false` (and give collections `read: () => true` or a published-only query), or query `where: { _status: { equals: 'published' } }` explicitly.
- **REST**: https://payloadcms.com/docs/rest-api/overview. Auto-generated under `/api` (`routes.api`): `GET/POST /api/{slug}`, `GET/PATCH/DELETE /api/{slug}/{id}`, globals `GET/POST /api/globals/{slug}`; params `depth, where, sort, limit, page, locale, select, populate`. Auth endpoints for auth-enabled collections. Custom endpoints via `endpoints` in config.
- **GraphQL**: https://payloadcms.com/docs/graphql/overview. `/api/graphql`; options `disable`, `disablePlaygroundInProduction`, `disableIntrospectionInProduction`. Intended for GraphQL-client use cases, query complexity limits, custom queries.
- **Recommendation**: Server Components use Local API; contact form posts to a Server Action (calls `payload.create({ collection: 'contact-submissions', data })`) or to `/api/contact-submissions` REST. Keep GraphQL off unless a client needs it.

Caching/revalidation: Local API calls are not Next `fetch` calls, so they are not cached by the Next data cache. Add a collection `afterChange` hook that calls `revalidatePath`/`revalidateTag` if you later cache pages. The `website` template does this (see `templates/website/src/collections`, `hooks`, https://github.com/payloadcms/payload/tree/main/templates/website/src). Not verified in docs for 16.3; check Next docs in `node_modules/next/dist/docs/01-app` for the current caching API before writing it.

## Collections and Globals

Collection (https://payloadcms.com/docs/configuration/collections). Required: `slug`, `fields`. Useful options: `access`, `auth`, `hooks`, `versions`, `admin.useAsTitle`, `timestamps` (default on), `labels`.

```ts
import type { CollectionConfig } from 'payload'
export const Posts: CollectionConfig = {
  slug: 'posts',
  fields: [{ name: 'title', type: 'text' }],
}
```

Global (https://payloadcms.com/docs/configuration/globals). Singletons for site-wide content; options `slug`, `fields`, `access`, `admin`, `hooks`, `versions`. Docs example:

```ts
import type { GlobalConfig } from 'payload'
export const Nav: GlobalConfig = {
  slug: 'nav',
  fields: [
    { name: 'items', type: 'array', required: true, maxRows: 8,
      fields: [{ name: 'page', type: 'relationship', relationTo: 'pages', required: true }] },
  ],
}
```

Read in Server Components with `payload.findGlobal({ slug: 'nav' })` (Local API; REST `GET /api/globals/nav`).

Suggested mapping for this template (design proposal, not copied from docs; syntax follows the two snippets above and the field/access docs):
- Globals: `header` (array of `{label, link}`), `footer` (array of links + text), `home` (4 sections; either 4 named groups or a `blocks` field with 4 block types).
- Collection `articles`: `title`, `slug` (text, unique), `excerpt`, `heroImage` (upload -> media), `content` (`richText`), `publishedAt`; `versions: { drafts: true }`; `admin.useAsTitle: 'title'`.
- Collection `contact-submissions`: `name`, `email`, `message`; `access: { create: () => true, read: ({ req }) => Boolean(req.user), update/delete: authenticated }`. Add rate-limit/honeypot yourself (not provided by Payload core).
- Optional: Form Builder plugin (`@payloadcms/plugin-form-builder`, `formBuilderPlugin({})`) creates `forms` and `form-submissions` collections and accepts POST to `/api/form-submissions`; the frontend renders its own UI from the schema (https://payloadcms.com/docs/plugins/form-builder). Heavier than needed for one fixed contact form.

Drafts (https://payloadcms.com/docs/versions/drafts): `versions: { drafts: true }` on a collection or global; `schedulePublish` requires Jobs processing. Local API `draft: true` on `find`/`findByID`/`create`/`update` returns/writes the latest version; `_status` is `'draft' | 'published'`. Public queries should filter `_status: 'published'`.

Live Preview (https://payloadcms.com/docs/live-preview/overview): `admin.livePreview: { url, collections: [...] }` (url can be a function of `{data, collectionConfig, locale}`). For Next.js server rendering use `RefreshRouteOnSave` from `@payloadcms/live-preview-react`; working example at https://github.com/payloadcms/payload/tree/main/examples/live-preview. It needs an extra package and a preview route; defer until v2 of the template.

Types: `payload generate:types` writes `payload-types.ts` (configurable via `typescript.outputFile`) (https://payloadcms.com/docs/typescript/overview).

## Postgres adapter

https://payloadcms.com/docs/database/postgres

```ts
import { postgresAdapter } from '@payloadcms/db-postgres'
export default buildConfig({
  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL } }),
})
```

Options: `pool` (required), `push` (Drizzle `db push`, on by default in development), `migrationDir`, `schemaName` (default `public`), `idType` (`'serial'` or `'uuid'`). Set `idType` before first use; changing it later is a breaking schema change (inference, not stated verbatim on the page). Vercel alternative: `@payloadcms/db-vercel-postgres` reads `POSTGRES_URL`.

Migrations (https://payloadcms.com/docs/database/migrations): CLI `payload migrate`, `migrate:create [name]`, `migrate:status`, `migrate:down`, `migrate:refresh`, `migrate:reset`, `migrate:fresh`. Dev: push mode syncs schema automatically, no migration needed locally. Production: run migrations before build, e.g. `"ci": "payload migrate && pnpm build"`. `prodMigrations` runs migrations on startup, but can slow serverless cold starts. Warning from the Postgres page: do not mix manual `migrate` runs with `push` against the same DB. Practical flow: develop with push, run `payload migrate:create` once the schema stabilizes, commit `migrations/`, and run `payload migrate` in CI/deploy.

## Lexical rich text

Config (https://payloadcms.com/docs/rich-text/overview, https://payloadcms.com/docs/rich-text/lexical):

```ts
import { lexicalEditor } from '@payloadcms/richtext-lexical'
export default buildConfig({ editor: lexicalEditor({}), /* ... */ })
```

Per-field override: `{ name: 'content', type: 'richText', editor: lexicalEditor({}) }`. Customize features: `lexicalEditor({ features: ({ defaultFeatures }) => [...defaultFeatures, /* e.g. HeadingFeature, FixedToolbarFeature */] })`. The install page's config example always includes `editor: lexicalEditor()` at root, so treat it as required in practice. Install `@payloadcms/richtext-lexical` at the same version as `payload` (3.90.2).

Rendering in Next (https://payloadcms.com/docs/rich-text/converting-jsx):

```tsx
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

export const Body = ({ data }: { data: SerializedEditorState }) => <RichText data={data} />
```

Custom converters: `converters={({ defaultConverters }) => ({ ...defaultConverters, /* overrides, blocks by slug */ })}`; helpers `LinkJSXConverter` (internal doc links), `SerializedBlockNode`, `SerializedUploadNode`. Other converters (HTML, plaintext, Markdown/MDX) are listed at https://payloadcms.com/docs/rich-text/converters (HTML snippet was not retrieved; read the "Converting HTML" page if needed).

## Gotchas and open questions

- **cacheComponents**: `withPayload` sets `PAYLOAD_CACHE_COMPONENTS_ENABLED` when `nextConfig.cacheComponents` is truthy, so it is at least recognized, but support level is not documented in what I fetched. This repo has Next 16.3 skills for Cache Components; if the user wants that, test the admin routes explicitly.
- **staleTimes**: `withPayload` warns if `experimental.staleTimes.dynamic` is non-zero (slows admin transitions).
- **Two root layouts**: after the route-group split, there is no shared root layout; both groups render their own `<html>/<body>`. Tailwind `globals.css` import belongs in `(frontend)/layout.tsx` only.
- **Route collisions**: admin owns `/admin` and API owns `/api/*`; do not put frontend routes there. Contact form Server Action avoids exposing REST write access.
- **Local API bypasses access control by default**: easy to leak drafts on public pages. Use `overrideAccess: false` or explicit `_status` filter.
- **sharp build script disabled** in `pnpm-workspace.yaml` (`sharp: false`); decide before using Media image sizes.
- **Package versions drift**: all `@payloadcms/*` must be identical; `^3.90.2` caret ranges risk mismatches on future installs. Prefer exact pins.
- **Typegen / import map** must be regenerated (`generate:types`, `generate:importmap`) after config or custom component changes.
- **Env vars needed**: `PAYLOAD_SECRET`, `DATABASE_URL`.
- **Open**: Next 16.3's docs in `node_modules/next/dist/docs` were not read in depth for Payload-specific interactions (e.g. `proxy.ts` vs middleware, caching APIs for `revalidatePath` after `afterChange`). Payload docs did not mention either in the pages fetched.
- **Open**: the install page's "16.2.6+" vs peer `>=16.3.3` discrepancy (above).
- **Open**: tool-summarized pages: re-open the cited URLs for exact option names before relying on them (notably `autosave`, `schedulePublish`, `prodMigrations`).
