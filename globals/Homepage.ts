import type { Access, Block, Field, GlobalConfig } from "payload";

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

/**
 * An item held inline in a Section, such as one product or solution. Every
 * field is optional; an item without a title is skipped, and so is any other
 * empty field.
 */
const itemFields: Field[] = [
  { name: "title", type: "text" },
  { name: "image", type: "upload", relationTo: "media" },
  { name: "text", type: "textarea" },
  {
    name: "link",
    type: "group",
    admin: { description: "Shown only when both the label and the URL are filled." },
    fields: [
      { name: "label", type: "text" },
      { name: "url", type: "text" },
    ],
  },
];

/** A heading over a slider that shows one product at a time. */
const ProductsSliderSection: Block = {
  slug: "productsSlider",
  interfaceName: "ProductsSliderSection",
  labels: { singular: "Products Slider", plural: "Products Sliders" },
  fields: [
    { name: "heading", type: "text" },
    {
      name: "items",
      type: "array",
      interfaceName: "SectionItem",
      labels: { singular: "Product", plural: "Products" },
      fields: itemFields,
    },
  ],
};

/** A heading over a grid of solutions. */
const SolutionsSection: Block = {
  slug: "solutions",
  interfaceName: "SolutionsSection",
  labels: { singular: "Solutions", plural: "Solutions Sections" },
  fields: [
    { name: "heading", type: "text" },
    {
      name: "items",
      type: "array",
      interfaceName: "SectionItem",
      labels: { singular: "Solution", plural: "Solutions" },
      fields: itemFields,
    },
  ],
};

/** A heading over questions with expandable answers. An item needs both a question and an answer. */
const FaqSection: Block = {
  slug: "faq",
  interfaceName: "FaqSection",
  labels: { singular: "FAQ", plural: "FAQs" },
  fields: [
    { name: "heading", type: "text" },
    {
      name: "items",
      type: "array",
      interfaceName: "FaqItems",
      labels: { singular: "Question", plural: "Questions" },
      fields: [
        { name: "question", type: "text" },
        { name: "answer", type: "textarea" },
      ],
    },
  ],
};

/**
 * A full-width image with text and a call-to-action button. Every field is
 * optional; empty ones are skipped. The CTA links to an Article, normally the
 * Contact Page, so its address follows the Article's slug in each Locale. It
 * is shown only when both the label and the Article are set and the Article is
 * Published with a title in the Locale.
 */
const BannerSection: Block = {
  slug: "banner",
  interfaceName: "BannerSection",
  labels: { singular: "Banner", plural: "Banners" },
  fields: [
    { name: "image", type: "upload", relationTo: "media" },
    { name: "text", type: "textarea" },
    {
      name: "cta",
      type: "group",
      admin: { description: "Shown only when both the label and the Article are set." },
      fields: [
        { name: "label", type: "text" },
        {
          name: "article",
          type: "relationship",
          relationTo: "articles",
          admin: { description: "The Contact Page, or any other Article to lead Visitors to." },
        },
      ],
    },
  ],
};

/** Editors (signed in) read the Homepage's Drafts; Visitors read only what is published. */
const publishedUnlessEditor: Access = ({ req }) =>
  req.user ? true : { _status: { equals: "published" } };

export const Homepage: GlobalConfig = {
  slug: "homepage",
  // Visitors read it through the Local API with `overrideAccess: false`.
  access: { read: publishedUnlessEditor },
  // Editors prepare changes as a Draft and preview them; Visitors read only
  // what is published. Homepage only: Header and Footer go live on save.
  versions: { drafts: true },
  admin: {
    livePreview: {
      // Signs the Editor into Next's Draft Mode, then redirects to the
      // Locale's Homepage (`/hr`, `/en`), which then reads the latest Draft.
      url: ({ locale }) => `/api/preview?locale=${locale.code}`,
    },
  },
  fields: [
    {
      name: "sections",
      type: "blocks",
      // The whole list is per Locale: each Locale has its own Sections and order.
      localized: true,
      blocks: [HeroSection, ProductsSliderSection, SolutionsSection, FaqSection, BannerSection],
    },
  ],
  hooks: { afterChange: [revalidateAllPagesAfterChange] },
};
