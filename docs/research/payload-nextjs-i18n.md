# Payload 3.90.2 + Next 16.3.8: i18n research

Sources: Payload docs at `https://github.com/payloadcms/payload/blob/v3.90.2/docs/...` (raw: `raw.githubusercontent.com/payloadcms/payload/v3.90.2/docs/...`), Payload source at the same tag, and Next docs in `node_modules/next/dist/docs/01-app`. Payload is not installed locally, so nothing was verified against installed code.

## 1. Enabling localization (hr default, en)

Source: `docs/configuration/localization.mdx`.

```ts
buildConfig({
  localization: {
    locales: [{ code: 'hr', label: 'Hrvatski' }, { code: 'en', label: 'English' }],
    defaultLocale: 'hr',
    fallback: true, // default true
  },
})
```

- `locales` and `defaultLocale` are required. `fallback` defaults to true. A locale object can also take `rtl` and a per-locale `fallbackLocale` (a single locale or an array).
- Localization works per field, not per document. Put `localized: true` on any field that has a `name`. That includes arrays and blocks. Localizing a container field creates localized sets of everything inside it. You can localize the whole `blocks` field or only selected inner fields.
- Fallback: with `fallback: true`, a field with no value in the requested locale returns the fallback locale's value. Fallback is only about missing values. This is the same file.
- Local API: `payload.find({ collection, locale: 'en', fallbackLocale: false })`. `fallbackLocale` accepts a locale, an array of locales, `'none'`, `'null'`, `'false'` or `false`. `locale: 'all'` or `'*'` returns every locale keyed by code. REST uses `?locale=` and `?fallback-locale=`. GraphQL uses the `locale` and `fallbackLocale` args.
- Globals: `docs/configuration/localization.mdx` says "Draft-enabled collections and globals", and the source `packages/payload/src/globals/operations/update.ts` handles locale options. The same field-level `localized: true` rule applies, but the docs have no dedicated globals section.
- Blocks: supported, see the `blocks` note above.
- Lexical: `docs/fields/rich-text.mdx` line 32 lists `localized` as a field option. The Lexical docs say nothing more specific. The whole editor state is stored per locale, so a localized richText field holds one document per locale. This is an inference from the field-level model, not an explicit statement.
- Enabling later versus now: the warning in `localization.mdx` says converting a field to or from `localized: true` changes the data structure and "existing data for this field will be lost". Plan a manual migration if you flip it later. Setting `localized: true` on content fields from day one costs nothing.

## 2. Admin UI language (separate from content locale)

Source: `docs/configuration/i18n.mdx`.

- Config key `i18n: { supportedLanguages: { en, hr }, fallbackLanguage: 'en' }`. Default `fallbackLanguage` is `'en'`.
- Import with `import { hr } from '@payloadcms/translations/languages/hr'`. The docs example uses `.../languages/de`.
- Payload ships an hr translation. `packages/translations/src/languages/hr.ts` exists at v3.90.2, from the GitHub contents API for that tag.
- The docs advise supporting only the languages you need, to keep the bundle small.
- `i18n.translations` overrides individual strings or adds custom ones.
- Each user picks the admin language in their account. The content locale is selected separately in the locale selector.

## 3. Next routing

Source: `01-app/02-guides/internationalization.md`.

- The guide's pattern is `app/[lang]/...`, with every special file nested under it. `generateStaticParams` returns the locales. `next/root-params` (`01-app/03-api-reference/04-functions/next-root-params.md`) gives a `lang()` or `locale()` getter in Server Components, named after the folder.
- Root params only work if the dynamic segment sits above the root layout, so `app/[locale]/layout.tsx` is the root layout. Getters do not work in Client Components, Server Actions or Route Handlers.
- Prefixed or not: the guide only shows the redirect-to-prefixed approach. The default locale is prefixed too (`/en-US/products`). An unprefixed default needs a proxy rewrite, for example `/foo` rewritten to `/hr/foo`, or a redirect when the prefix equals the default. This is my inference, not shown in the docs.
- Coexisting with Payload: the guide has no Payload section. Use route groups, per `01-app/01-getting-started/02-project-structure.md` ("Creating multiple root layouts"). Put the site in `app/(site)/[locale]/layout.tsx` and Payload in `app/(payload)/layout.tsx`. Each has its own `<html>`. The Payload admin and API (`/admin`, `/api`) are not locale-prefixed.
- Because of that, the proxy matcher must exclude `/admin`, `/api` and `_next`, plus static files. The guide's matcher `'/((?!_next).*)'` would catch `/admin`, so add exclusions.
- File name in 16.x: `proxy.ts` at the project root or in `src`, exporting `proxy(request)` or a default function. `middleware.ts` is deprecated and renamed (`03-api-reference/03-file-conventions/proxy.md`, v16.0.0 changelog row). Proxy defaults to the Node.js runtime. The `runtime` config option throws if set.
- API: `import { NextResponse } from 'next/server'`, `request.nextUrl`, `NextResponse.redirect()` or `rewrite()`, and `export const config = { matcher }`.
- `Accept-Language`: the guide uses `negotiator` plus `@formatjs/intl-localematcher`. `match(new Negotiator({ headers }).languages(), locales, defaultLocale)` returns the locale, with the default as fallback.
- Static: `generateStaticParams` in the layout returns `[{ locale: 'hr' }, { locale: 'en' }]`. Set `<html lang={await locale()}>` in the layout.

## 4. Localized slugs and hreflang

- Payload's built-in `slugField({ localized: true })` is documented as experimental (`docs/fields/text.mdx`, "Slug Field"). `localized` defaults to false. `disableUnique` disables the unique index. Alternatively define your own `text` field with `localized: true` and `unique: true`.
- Unique caveat: on MongoDB, `unique` or `index` on a localized field creates one index per locale path (`docs/database/indexes.mdx`, "Localized fields and MongoDB indexes"). The docs say nothing about Postgres. Uniqueness is expected to be enforced per locale there, because localized values live in `_locales` rows. This is unverified, so test it. With `fallback: true`, a slug lookup by `where: { slug: { equals } }` plus `locale` only matches that locale's stored value.
- Routing: find a doc by slug in the URL's locale (`locale: params.locale`, `fallbackLocale: false`). To build a language switcher or alternates, fetch the doc with `locale: 'all'` and read each locale's slug.
- Metadata: `generateMetadata` returns `alternates: { canonical, languages: { hr: '/hr/...', en: '/en/...' } }` (`03-api-reference/04-functions/generate-metadata.md`, lines 401-407 and 823+). Absolute URLs need `metadataBase`. Add `'x-default'` for the default locale if wanted. The docs example does not show `x-default`, but the `languages` keys are open.
- Only emit an alternate for a locale if the doc actually has content or a slug there. Otherwise fallback would serve duplicate content.

## 5. Drafts and localization

Sources: `docs/configuration/localization.mdx` ("Status Localization") and `docs/versions/drafts.mdx`.

- By default `_status` is a single string for the whole document. Publishing makes the latest content published for all locales.
- Beta option: set `experimental: { localizeStatus: true }` and `versions.drafts.localizeStatus: true`. `status` is then stored as `{ hr: 'published', en: 'draft' }`. The admin UI shows the status of the selected locale and lets you unpublish one locale. The docs call it experimental and say to test before production.
- Source (`packages/payload/src/collections/operations/update.ts`, `updateByID.ts`, `versions/saveVersion.ts`, `globals/operations/update.ts`) has Local API options `publishSpecificLocale?: string`, `publishAllLocales?: boolean` and `unpublishAllLocales?: boolean`. They are not in the docs pages I read, so treat them as source-level and check before depending on them.
- The drafts docs page has no further locale text. Preview receives the current `locale` in the preview URL function args (`docs/admin/preview.mdx`).

## 6. Postgres adapter gotchas

Source: `docs/database/postgres.mdx` line 76; the rest is inferred and not verified.

- `localesSuffix` option (default `'_locales'`) names the tables holding localized fields. A localized field is stored in `<table>_locales`, with a `_locale` column and one row per locale. Versions tables get `_<collection>_v_locales` the same way. This naming follows from the option but is not spelled out in the docs.
- Because of that layout, flipping `localized` later is a real schema migration (columns move between the main and `_locales` tables). The "data loss" warning applies. Decide before the first deploy.
- `docs/database/migrations.mdx` has no locale-specific section. The usual flow is `payload migrate:create` after any schema change, including adding a locale or a `localized` field.
- Dev mode `push` auto-syncs the schema. Production should use migrations.
- Unique indexes on localized columns in Postgres are not documented, as noted in section 4.
- Adding a new locale later needs no schema change. Rows are simply added per locale.
- The website template (`templates/website/src/payload.config.ts` at v3.90.2) has no `localization` or `i18n` config. There is no template reference for locale routing.
