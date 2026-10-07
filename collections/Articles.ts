import type { Access, CollectionConfig } from "payload";

import { revalidateContentAfterChange, revalidateContentAfterDelete } from "../lib/cache";
import { validateArticleCategory, validateArticleSlug } from "../lib/url-segments";

/** Editors (signed in) read every Article; Visitors read only Published ones. */
const publishedUnlessEditor: Access = ({ req }) =>
  req.user ? true : { _status: { equals: "published" } };

export const Articles: CollectionConfig = {
  slug: "articles",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "category", "publishedAt"],
  },
  defaultSort: "-publishedAt",
  // Drafts let Editors prepare an Article; Visitors see only what is published.
  // Public reads pass `overrideAccess: false`, so this rule applies to them.
  // A Draft claims its address too, so Draft saves run the same validation;
  // Payload skips it for Drafts by default.
  versions: { drafts: { validate: true } },
  access: { read: publishedUnlessEditor },
  fields: [
    { name: "title", type: "text", required: true, localized: true },
    {
      name: "slug",
      type: "text",
      required: true,
      localized: true,
      index: true,
      validate: validateArticleSlug,
      admin: { description: "URL segment of this Article in this Locale." },
    },
    {
      name: "coverImage",
      type: "upload",
      relationTo: "media",
      admin: { position: "sidebar" },
    },
    { name: "body", type: "richText", localized: true },
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
      required: true,
      validate: validateArticleCategory,
      admin: { position: "sidebar" },
    },
    {
      name: "showContactForm",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Show the Contact Form below the body. The Contact Page has this on.",
      },
    },
    {
      name: "privacyPolicy",
      type: "relationship",
      relationTo: "articles",
      admin: {
        position: "sidebar",
        condition: (data) => Boolean(data?.showContactForm),
        description: "The Article the Contact Form's consent checkbox links to.",
      },
    },
    {
      name: "publishedAt",
      type: "date",
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: { position: "sidebar", date: { pickerAppearance: "dayOnly" } },
    },
  ],
  hooks: {
    afterChange: [revalidateContentAfterChange],
    afterDelete: [revalidateContentAfterDelete],
  },
};
