import config from "@payload-config";
import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { getPayload } from "payload";

import { hasLocale } from "@/lib/i18n/locales";

/**
 * Entry point of the Homepage's Live Preview: `/api/preview?locale=en`.
 *
 * Only a signed-in Editor gets Draft Mode, which makes the Homepage read its
 * latest Draft and skip every cache for that browser. The redirect target is
 * built from a known Locale, never taken from the query, so this is no open
 * redirect.
 */
export async function GET(request: Request) {
  const locale = new URL(request.url).searchParams.get("locale") ?? "";
  if (!hasLocale(locale)) return new Response("Unknown Locale", { status: 400 });

  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });
  if (!user) return new Response("Sign in to the admin to preview", { status: 401 });

  (await draftMode()).enable();
  redirect(`/${locale}`);
}
