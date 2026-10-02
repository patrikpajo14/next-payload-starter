import type { GlobalConfig } from "payload";

import { revalidateAllPagesAfterChange } from "../lib/cache";
import { linkFields } from "./link-fields";

export const Footer: GlobalConfig = {
  slug: "footer",
  // Visitors read it through the Local API with `overrideAccess: false`.
  access: { read: () => true },
  fields: [
    { name: "text", type: "textarea", localized: true },
    {
      name: "links",
      type: "array",
      // The whole list is per Locale: link targets differ between /hr and /en.
      localized: true,
      fields: linkFields,
    },
  ],
  hooks: { afterChange: [revalidateAllPagesAfterChange] },
};
