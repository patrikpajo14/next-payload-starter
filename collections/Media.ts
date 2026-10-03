import type { CollectionConfig } from "payload";

import { revalidateContentAfterChange, revalidateContentAfterDelete } from "../lib/cache";

/**
 * Images Editors upload. Files go to local disk (`media/`) unless S3 storage
 * is configured, see `lib/media-storage.ts`.
 */
export const Media: CollectionConfig = {
  slug: "media",
  // Visitors load images straight from the file URL, without a session.
  access: { read: () => true },
  upload: {
    mimeTypes: ["image/*"],
    // Generated with sharp on upload. Height is left out to keep the aspect ratio.
    imageSizes: [
      // Admin list previews.
      { name: "thumbnail", width: 300 },
      // Article List entries and other in-page images narrower than the full layout.
      { name: "card", width: 768 },
    ],
    adminThumbnail: "thumbnail",
  },
  fields: [{ name: "alt", type: "text", required: true, localized: true }],
  // Pages show images through cached Article reads; a new file or alt text refreshes them.
  hooks: {
    afterChange: [revalidateContentAfterChange],
    afterDelete: [revalidateContentAfterDelete],
  },
};
