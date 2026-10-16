import { resendAdapter } from "@payloadcms/email-resend";

/**
 * Payload's email adapter. With `RESEND_API_KEY` set it sends through Resend;
 * without it returns `undefined`, so Payload keeps its default of logging
 * emails to the console and development needs no provider.
 */
export function emailAdapter(env: Record<string, string | undefined> = process.env) {
  const apiKey = env.RESEND_API_KEY?.trim();
  if (!apiKey) return undefined;

  return resendAdapter({
    apiKey,
    // Resend's shared test sender works before a domain is verified.
    defaultFromAddress: env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev",
    defaultFromName: env.RESEND_FROM_NAME?.trim() || "Contact Form",
  });
}
