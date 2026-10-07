import { getHomepageSections } from "@/lib/homepage";
import { getLocale, getMessages } from "@/lib/i18n/server";

import { HeroSection } from "./_components/HeroSection";

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getMessages();
  const sections = await getHomepageSections(locale);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-16 px-4 py-16">
      {/* Editors repeat and reorder Sections, so none of them can own the Page's one h1. */}
      <h1 className="sr-only">{t.siteTitle}</h1>
      {sections.map((section, index) => {
        switch (section.blockType) {
          case "hero":
            return <HeroSection key={section.id} hero={section} priority={index === 0} />;
        }
      })}
    </main>
  );
}
