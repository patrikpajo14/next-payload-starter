import type { CollectionConfig } from "payload";

import { locales } from "../lib/i18n/locales";

/**
 * Messages Visitors send through the Contact Form. Anyone can create one;
 * only Editors (signed in) can read or delete them, and nobody edits them.
 */
export const ContactSubmissions: CollectionConfig = {
  slug: "contact-submissions",
  admin: {
    useAsTitle: "lastName",
    defaultColumns: ["firstName", "lastName", "phone", "visitorLocale", "createdAt"],
  },
  defaultSort: "-createdAt",
  access: {
    create: () => true,
    read: ({ req }) => Boolean(req.user),
    update: () => false,
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: "firstName", type: "text", required: true, maxLength: 200 },
    { name: "lastName", type: "text", required: true, maxLength: 200 },
    { name: "email", type: "email" },
    { name: "phone", type: "text", required: true, maxLength: 200 },
    { name: "address", type: "text", required: true, maxLength: 200 },
    { name: "postalCode", type: "text", required: true, maxLength: 200 },
    { name: "message", type: "textarea", required: true, maxLength: 5000 },
    {
      name: "visitorLocale",
      type: "select",
      required: true,
      options: locales.map((code) => ({ label: code.toUpperCase(), value: code })),
      admin: { description: "The Locale the Visitor was reading when they sent the message." },
    },
  ],
};
