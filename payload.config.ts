import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { en } from "@payloadcms/translations/languages/en";
import { hr } from "@payloadcms/translations/languages/hr";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Articles } from "./collections/Articles";
import { Categories } from "./collections/Categories";
import { ContactSubmissions } from "./collections/ContactSubmissions";
import { Media } from "./collections/Media";
import { Users } from "./collections/Users";
import { Footer } from "./globals/Footer";
import { Header } from "./globals/Header";
import { Homepage } from "./globals/Homepage";
import { defaultLocale, localeLabels, locales } from "./lib/i18n/locales";
import { mediaStorage } from "./lib/media-storage";

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users, Media, Categories, Articles, ContactSubmissions],
  globals: [Header, Footer, Homepage],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? "",
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL ?? "",
      // Neon sits behind a pooler across the network. Keep-alive probes notice a
      // socket that died silently (`read ETIMEDOUT`) instead of leaving a query
      // hanging for minutes. No query timeout: schema introspection is slow.
      keepAlive: true,
      connectionTimeoutMillis: 60_000,
    },
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
