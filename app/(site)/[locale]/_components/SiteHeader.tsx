import Link from "next/link";

import { getLocale, getMessages } from "@/lib/i18n/server";
import { getHeader } from "@/lib/site-chrome";

import { LanguageSwitcher } from "./LanguageSwitcher";
import { LinkList } from "./LinkList";

export async function SiteHeader() {
  const locale = await getLocale();
  const t = await getMessages();
  const { navItems } = await getHeader(locale);

  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href={`/${locale}`} className="font-semibold">
          {t.siteTitle}
        </Link>
        <LinkList label={t.mainNavigation} links={navItems} />
        <LanguageSwitcher current={locale} label={t.languageSwitcher} />
      </div>
    </header>
  );
}
