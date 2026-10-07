import type { Block, GlobalConfig } from "payload";

import { revalidateAllPagesAfterChange } from "../lib/cache";

/** A full-width image with a heading and text. Every field is optional; empty ones are skipped. */
const HeroSection: Block = {
  slug: "hero",
  interfaceName: "HeroSection",
  labels: { singular: "Hero", plural: "Heroes" },
  fields: [
    { name: "image", type: "upload", relationTo: "media" },
    { name: "heading", type: "text" },
    { name: "text", type: "textarea" },
  ],
};

export const Homepage: GlobalConfig = {
  slug: "homepage",
  // Visitors read it through the Local API with `overrideAccess: false`.
  access: { read: () => true },
  fields: [
    {
      name: "sections",
      type: "blocks",
      // The whole list is per Locale: each Locale has its own Sections and order.
      localized: true,
      blocks: [HeroSection],
    },
  ],
  hooks: { afterChange: [revalidateAllPagesAfterChange] },
};
