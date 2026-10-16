import type { Payload } from "payload";

import type { ContactData } from "./contact-form";
import type { Locale } from "./i18n/locales";

/**
 * Emails the site owner a stored Contact Submission. Never throws: the
 * Submission is already stored, so a failed email is logged and the Visitor
 * still sees success. Without `CONTACT_NOTIFY_EMAIL` it sends nothing, so
 * development runs without a provider.
 */
export async function notifyContactSubmission(
  payload: Payload,
  submission: ContactData & { visitorLocale: Locale },
  env: Record<string, string | undefined> = process.env,
): Promise<void> {
  const to = env.CONTACT_NOTIFY_EMAIL?.trim();
  if (!to) return;

  const name = `${submission.firstName} ${submission.lastName}`;
  try {
    await payload.sendEmail({
      to,
      replyTo: submission.email,
      subject: `New message from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${submission.email ?? "-"}`,
        `Phone: ${submission.phone}`,
        `Address: ${submission.address}, ${submission.postalCode}`,
        `Locale: ${submission.visitorLocale}`,
        "",
        submission.message,
      ].join("\n"),
    });
  } catch (error) {
    payload.logger.error({ err: error }, "Contact Submission notification was not sent");
  }
}
