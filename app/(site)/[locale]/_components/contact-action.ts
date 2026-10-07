"use server";

import config from "@payload-config";
import { getPayload } from "payload";

import { CONTACT_FIELDS, validateContactForm } from "@/lib/contact-form";
import type { ContactField } from "@/lib/contact-form";
import { hasLocale } from "@/lib/i18n/locales";

export interface ContactFormState {
  status: "idle" | "success" | "invalid" | "failed";
  /** What the Visitor typed, so a rejected form keeps its values. */
  values: Partial<Record<ContactField, string>>;
  errors: Partial<Record<ContactField, string>>;
}

/**
 * Stores a Contact Submission. A filled honeypot field means a bot: it gets the
 * same success answer as a Visitor, and nothing is stored.
 */
export async function submitContactForm(
  _previous: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const locale = formData.get("locale");
  if (typeof locale !== "string" || !hasLocale(locale)) {
    return { status: "failed", values: {}, errors: {} };
  }

  const values: ContactFormState["values"] = {};
  for (const field of CONTACT_FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string") values[field] = value;
  }

  if (formData.get("website")) return { status: "success", values: {}, errors: {} };

  const result = validateContactForm(values, locale);
  if (!result.ok) return { status: "invalid", values, errors: result.errors };

  const payload = await getPayload({ config });
  try {
    await payload.create({
      collection: "contact-submissions",
      data: { ...result.data, visitorLocale: locale },
      // Public create: the collection's own access rule applies.
      overrideAccess: false,
    });
  } catch (error) {
    payload.logger.error({ err: error }, "Contact Submission was not stored");
    return { status: "failed", values, errors: {} };
  }
  return { status: "success", values: {}, errors: {} };
}
