import { notFound } from "next/navigation";
import { locale } from "next/root-params";

import { hasLocale } from "./locales";
import type { Locale } from "./locales";
import { messages } from "./messages";
import type { Messages } from "./messages";

/** The Locale of the current request. Server Components only. */
export async function getLocale(): Promise<Locale> {
  const current = await locale();
  if (!current || !hasLocale(current)) notFound();
  return current;
}

export async function getMessages(): Promise<Messages> {
  return messages[await getLocale()];
}
