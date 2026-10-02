import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { en } from "@payloadcms/translations/languages/en";
import { hr } from "@payloadcms/translations/languages/hr";
import { buildConfig } from "payload";

import { Users } from "./collections/Users";

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? "",
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL ?? "" },
  }),
  // Content locales. Changing `localized` on a field later loses its data, so
  // every translatable field is localized from the start.
  localization: {
    locales: [
      { code: "hr", label: "Hrvatski" },
      { code: "en", label: "English" },
    ],
    defaultLocale: "hr",
    fallback: true,
  },
  // Admin UI language, separate from content locales.
  i18n: {
    supportedLanguages: { hr, en },
    fallbackLanguage: "hr",
  },
  graphQL: { disable: true },
  typescript: { outputFile: "payload-types.ts" },
});
