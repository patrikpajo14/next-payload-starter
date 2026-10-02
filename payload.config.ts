import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { en } from "@payloadcms/translations/languages/en";
import { hr } from "@payloadcms/translations/languages/hr";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Media } from "./collections/Media";
import { Users } from "./collections/Users";
import { Footer } from "./globals/Footer";
import { Header } from "./globals/Header";
import { defaultLocale, localeLabels, locales } from "./lib/i18n/locales";
import { mediaStorage } from "./lib/media-storage";

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users, Media],
  globals: [Header, Footer],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? "",
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL ?? "" },
  }),
  // Content locales. Changing `localized` on a field later loses its data, so
  // every translatable field is localized from the start.
  localization: {
    locales: locales.map((code) => ({ code, label: localeLabels[code] })),
    defaultLocale,
    fallback: true,
  },
  // Admin UI language, separate from content locales.
  i18n: {
    supportedLanguages: { hr, en },
    fallbackLanguage: "hr",
  },
  graphQL: { disable: true },
  // Resizes uploads into the image sizes declared on Media.
  sharp,
  plugins: [mediaStorage()],
  typescript: { outputFile: "payload-types.ts" },
});
