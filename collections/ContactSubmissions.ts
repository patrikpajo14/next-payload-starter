import type { CollectionConfig } from "payload";

import { locales } from "../lib/i18n/locales";

/**
 * Messages Visitors send through the Contact Form. Nobody creates one through
 * the API: the `submitContactForm` server action writes with `overrideAccess`,
 * after the honeypot and validation, and it stores a salted hash of the
 * Visitor's IP address in `ipHash`. Only Editors (signed in) can read or
 * delete them, and nobody edits them.
 */
export const ContactSubmissions: CollectionConfig = {
  slug: "contact-submissions",
  admin: {
    useAsTitle: "lastName",
    defaultColumns: ["firstName", "lastName", "phone", "visitorLocale", "createdAt"],
  },
  defaultSort: "-createdAt",
  access: {
    create: () => false,
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
    {
      name: "ipHash",
      type: "text",
      // Written by the server action only. No read access, so neither the admin
      // nor the REST API returns it to Editors; Local API calls that override
      // access can still read it.
      access: { read: () => false, create: () => false, update: () => false },
      admin: { hidden: true },
    },
  ],
};
