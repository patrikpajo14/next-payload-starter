import type { CollectionConfig } from "payload";

import { revalidateContentAfterChange, revalidateContentAfterDelete } from "../lib/cache";
import { validateSeoName } from "../lib/url-segments";

export const Categories: CollectionConfig = {
  slug: "categories",
  admin: { useAsTitle: "title" },
  // Visitors read Categories through the Local API with `overrideAccess: false`.
  access: { read: () => true },
  fields: [
    { name: "title", type: "text", required: true, localized: true },
    {
      name: "seoName",
      type: "text",
      localized: true,
      index: true,
      validate: validateSeoName,
      admin: {
        description:
          "URL segment of the Article List in this Locale. Leave empty to serve this Category's Articles directly under the Locale (Standalone Articles).",
      },
    },
  ],
  hooks: {
    afterChange: [revalidateContentAfterChange],
    afterDelete: [revalidateContentAfterDelete],
  },
};
