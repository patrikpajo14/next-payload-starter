"use server";

import config from "@payload-config";
import { headers } from "next/headers";
import { after } from "next/server";
import { getPayload } from "payload";

import { notifyContactSubmission } from "@/lib/contact-notification";
import { isContactRateLimited } from "@/lib/contact-rate-limit";
import { CONTACT_FIELDS, validateContactForm } from "@/lib/contact-form";
import type { ContactField } from "@/lib/contact-form";
import { hasLocale } from "@/lib/i18n/locales";
import { clientIp, hashIp } from "@/lib/ip-hash";
import { requireEnv } from "@/lib/require-env";

export interface ContactFormState {
  status: "idle" | "success" | "invalid" | "failed" | "rate-limited";
  /** What the Visitor typed, so a rejected form keeps its values. */
  values: Partial<Record<ContactField, string>>;
  errors: Partial<Record<ContactField, string>>;
}

/**
 * Stores a Contact Submission. A filled honeypot field means a bot: it gets the
 * same success answer as a Visitor, and nothing is stored. The Visitor's IP
 * address is stored only as a salted hash, and a Visitor over the hourly limit
 * is refused. A stored Submission is emailed to the owner after the response;
 * that email failing never fails the Visitor.
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
    if (ipHash && (await isContactRateLimited(payload, ipHash))) {
      return { status: "rate-limited", values, errors: {} };
    }
    const data = { ...result.data, visitorLocale: locale };
    await payload.create({
      collection: "contact-submissions",
      data: { ...data, ipHash },
      // The collection denies create to everyone: this action is the only
      // writer, and has already run the honeypot, validation and rate limit above.
      overrideAccess: true,
    });
    after(() => notifyContactSubmission(payload, data));
  } catch (error) {
    payload.logger.error({ err: error }, "Contact Submission was not stored");
    return { status: "failed", values, errors: {} };
  }
  return { status: "success", values: {}, errors: {} };
}
