"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { ContactField } from "@/lib/contact-form";
import type { Locale } from "@/lib/i18n/locales";
import type { ContactMessages } from "@/lib/i18n/messages";

import { submitContactForm } from "./contact-action";
import type { ContactFormState } from "./contact-action";

const initialState: ContactFormState = { status: "idle", values: {}, errors: {} };

/**
 * The Contact Form. Works without JavaScript (a plain form post to the server
 * action) and keeps typed values when validation fails. `privacyPolicy` is the
 * address and title of the consent link, when the Article names one.
 */
export function ContactForm({
  locale,
  t,
  privacyPolicy,
}: {
  locale: Locale;
  t: ContactMessages;
  privacyPolicy: { href: string; title: string } | null;
}) {
  const [state, action, pending] = useActionState(submitContactForm, initialState);

  if (state.status === "success") {
    return (
      <p role="status" className="mt-10 rounded border p-4">
        {t.success}
      </p>
    );
  }

  function field(name: Exclude<ContactField, "consent">, label: string, extra = {}) {
    const error = state.errors[name];
    const id = `contact-${name}`;
    const props = {
      id,
      name,
      defaultValue: state.values[name] ?? "",
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? `${id}-error` : undefined,
      className: "rounded border px-3 py-2",
    };
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id}>{label}</label>
        {name === "message" ? <textarea rows={5} {...props} /> : <input {...props} {...extra} />}
        {error ? (
          <p id={`${id}-error`} className="text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form action={action} noValidate className="mt-10 flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      {field("firstName", t.firstName, { autoComplete: "given-name" })}
      {field("lastName", t.lastName, { autoComplete: "family-name" })}
      {field("email", `${t.email} ${t.emailOptional}`, { type: "email", autoComplete: "email" })}
      {field("phone", t.phone, { type: "tel", autoComplete: "tel" })}
      {field("address", t.address, { autoComplete: "street-address" })}
      {field("postalCode", t.postalCode, { inputMode: "numeric", autoComplete: "postal-code" })}
      {field("message", t.message)}
      <div className="flex flex-col gap-1">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            name="consent"
            defaultChecked={Boolean(state.values.consent)}
            aria-invalid={state.errors.consent ? true : undefined}
            aria-describedby={state.errors.consent ? "contact-consent-error" : undefined}
            className="mt-1"
          />
          <span>
            {privacyPolicy ? (
              <>
                {t.consentBefore}{" "}
                <Link href={privacyPolicy.href} className="underline">
                  {privacyPolicy.title}
                </Link>
              </>
            ) : (
              t.consentPlain
            )}
          </span>
        </label>
        {state.errors.consent ? (
          <p id="contact-consent-error" className="text-sm text-red-700">
            {state.errors.consent}
          </p>
        ) : null}
      </div>
      {/* Honeypot: invisible to Visitors, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {state.status === "failed" ? (
        <p role="alert" className="text-red-700">
          {t.failure}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-black px-5 py-2 text-white disabled:opacity-60"
      >
        {pending ? t.sending : t.submit}
      </button>
    </form>
  );
}
