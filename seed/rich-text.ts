import type { Article } from "@/payload-types";

/** A rich-text value with one paragraph per string, the shape the admin editor saves. */
export function paragraphs(...texts: string[]): NonNullable<Article["body"]> {
  return {
    root: {
      type: "root",
      direction: "ltr",
      format: "",
      indent: 0,
      version: 1,
      children: texts.map((text) => ({
        type: "paragraph",
        direction: "ltr",
        format: "",
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: "",
        children: [
          { type: "text", text, detail: 0, format: 0, mode: "normal", style: "", version: 1 },
        ],
      })),
    },
  };
}
