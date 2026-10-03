import type { CollectionConfig } from "payload";

import { revalidateContentAfterChange, revalidateContentAfterDelete } from "../lib/cache";
import { validateArticleCategory, validateArticleSlug } from "../lib/url-segments";

export const Articles: CollectionConfig = {
  slug: "articles",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "category", "publishedAt"],
  },
  defaultSort: "-publishedAt",
  // Visitors read Articles through the Local API with `overrideAccess: false`.
  access: { read: () => true },
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
