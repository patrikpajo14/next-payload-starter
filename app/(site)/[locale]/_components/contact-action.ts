"use server";

import config from "@payload-config";
import { headers } from "next/headers";
import { getPayload } from "payload";

import { CONTACT_FIELDS, validateContactForm } from "@/lib/contact-form";
import type { ContactField } from "@/lib/contact-form";
import { hasLocale } from "@/lib/i18n/locales";
import { clientIp, hashIp } from "@/lib/ip-hash";
import { requireEnv } from "@/lib/require-env";

export interface ContactFormState {
  status: "idle" | "success" | "invalid" | "failed";
  /** What the Visitor typed, so a rejected form keeps its values. */
  values: Partial<Record<ContactField, string>>;
  errors: Partial<Record<ContactField, string>>;
}

/**
 * Stores a Contact Submission. A filled honeypot field means a bot: it gets the
 * same success answer as a Visitor, and nothing is stored. The Visitor's IP
 * address is stored only as a salted hash.
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
    const ip = clientIp(await headers());
    const ipHash = ip ? hashIp(ip, requireEnv("IP_HASH_SALT")) : undefined;
    await payload.create({
      collection: "contact-submissions",
      data: { ...result.data, visitorLocale: locale, ipHash },
      // The collection denies create to everyone: this action is the only
      // writer, and has already run the honeypot and validation above.
      overrideAccess: true,
    });
  } catch (error) {
    payload.logger.error({ err: error }, "Contact Submission was not stored");
    return { status: "failed", values, errors: {} };
  }
  return { status: "success", values: {}, errors: {} };
}
