import { getLocale, getMessages } from "@/lib/i18n/server";
import { getFooter } from "@/lib/site-chrome";

import { LinkList } from "./LinkList";

export async function SiteFooter() {
  const locale = await getLocale();
  const t = await getMessages();
  const { text, links } = await getFooter(locale);

  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 text-sm">
        {text && <p className="whitespace-pre-line">{text}</p>}
        <LinkList label={t.footerNavigation} links={links} />
      </div>
    </footer>
  );
}
