import Link from "next/link";

import { getLocale, getMessages } from "@/lib/i18n/server";

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getMessages();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
      <h1 className="text-3xl font-semibold">{t.notFoundTitle}</h1>
      <p className="mt-4 text-lg">{t.notFoundBody}</p>
      <Link href={`/${locale}`} className="mt-6 inline-block underline">
        {t.backToHome}
      </Link>
    </main>
  );
}
