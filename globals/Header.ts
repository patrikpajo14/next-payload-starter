import type { GlobalConfig } from "payload";

import { revalidateAllPagesAfterChange } from "../lib/cache";
import { linkFields } from "./link-fields";

export const Header: GlobalConfig = {
  slug: "header",
  // Visitors read it through the Local API with `overrideAccess: false`.
  access: { read: () => true },
  fields: [
    {
      name: "navItems",
      type: "array",
      // The whole list is per Locale: link targets differ between /hr and /en.
      localized: true,
      fields: linkFields,
    },
  ],
  hooks: { afterChange: [revalidateAllPagesAfterChange] },
};
