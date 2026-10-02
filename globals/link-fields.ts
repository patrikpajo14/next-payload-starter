import type { Field } from "payload";

/** A label and a URL, such as `/hr/clanci` or `https://example.com`. */
export const linkFields: Field[] = [
  { name: "label", type: "text", required: true },
  { name: "url", type: "text", required: true },
];
