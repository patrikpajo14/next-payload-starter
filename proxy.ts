import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { locales } from "./lib/i18n/locales";
import { negotiateLocale } from "./lib/i18n/negotiate";

/** Sends a request without a Locale prefix to the Visitor's preferred Locale. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocalePrefix = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocalePrefix) return NextResponse.next();

  const locale = negotiateLocale(request.headers.get("accept-language"));
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  // 307, not a permanent redirect: the target depends on the Visitor's browser language.
  const response = NextResponse.redirect(url);
  response.headers.set("Vary", "Accept-Language");
  return response;
}

export const config = {
  // Skip the Payload admin and API, Next internals, and files with an extension.
  matcher: ["/((?!admin(?:/|$)|api(?:/|$)|_next/|.*\\..*).*)"],
};
