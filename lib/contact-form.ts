import type { Locale } from "./i18n/locales";
import { messages } from "./i18n/messages";

/** Fields of the Contact Form that hold text. */
export const CONTACT_TEXT_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "address",
  "postalCode",
  "message",
] as const;

/** Every field a Contact Form submission carries: the text fields and the consent checkbox. */
export const CONTACT_FIELDS = [...CONTACT_TEXT_FIELDS, "consent"] as const;

export type ContactField = (typeof CONTACT_FIELDS)[number];

/** What a Visitor submitted, as plain strings (a checked checkbox is any non-empty value). */
export type ContactInput = Partial<Record<ContactField, string>>;

export interface ContactData {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address: string;
  postalCode: string;
  message: string;
}

export type ContactResult =
  | { ok: true; data: ContactData }
  | { ok: false; errors: Partial<Record<ContactField, string>> };

const PHONE = /^[0-9 +-]+$/;
const POSTAL_CODE = /^\d{5}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Checks a Contact Form submission and words every problem in the Visitor's
 * Locale. The first name, last name, phone, address, postal code, message, and
 * consent are required; the email is optional but must look like one when given.
 */
export function validateContactForm(input: ContactInput, locale: Locale): ContactResult {
  const { errors: text } = messages[locale].contact;
  const value = (field: ContactField) => (input[field] ?? "").trim();
  const errors: Partial<Record<ContactField, string>> = {};

  for (const field of CONTACT_FIELDS) {
    if (field !== "email" && !value(field)) errors[field] = text.required;
  }
  if (value("phone") && !PHONE.test(value("phone"))) errors.phone = text.phone;
  if (value("postalCode") && !POSTAL_CODE.test(value("postalCode"))) {
    errors.postalCode = text.postalCode;
  }
  if (value("email") && !EMAIL.test(value("email"))) errors.email = text.email;

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      firstName: value("firstName"),
      lastName: value("lastName"),
      email: value("email") || undefined,
      phone: value("phone"),
      address: value("address"),
      postalCode: value("postalCode"),
      message: value("message"),
    },
  };
}
