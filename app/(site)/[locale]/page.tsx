import { getHomepageSections } from "@/lib/homepage";
import { getLocale, getMessages } from "@/lib/i18n/server";

import { BannerSection } from "./_components/BannerSection";
import { FaqSection } from "./_components/FaqSection";
import { HeroSection } from "./_components/HeroSection";
import { ProductsSliderSection } from "./_components/ProductsSliderSection";
import { SolutionsSection } from "./_components/SolutionsSection";

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
          case "productsSlider":
            return <ProductsSliderSection key={section.id} slider={section} t={t} />;
          case "solutions":
            return <SolutionsSection key={section.id} solutions={section} />;
          case "faq":
            return <FaqSection key={section.id} faq={section} />;
          case "banner":
            return <BannerSection key={section.id} banner={section} locale={locale} />;
        }
      })}
    </main>
  );
}
