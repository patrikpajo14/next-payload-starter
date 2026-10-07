import type { Messages } from "@/lib/i18n/messages";
import type { ProductsSliderSection as ProductsSlider } from "@/payload-types";

import { Carousel } from "./Carousel";
import { SectionItem, visibleItems } from "./SectionItem";

/**
 * A heading over a slider of products, one at a time. Products without a title
 * are skipped, and a Section with none left renders nothing.
 */
export function ProductsSliderSection({ slider, t }: { slider: ProductsSlider; t: Messages }) {
  const items = visibleItems(slider.items);
  if (items.length === 0) return null;

  return (
    <Carousel
      label={slider.heading || t.products}
      heading={slider.heading ? <h2 className="text-2xl font-semibold">{slider.heading}</h2> : null}
      previousLabel={t.previousProduct}
      nextLabel={t.nextProduct}
      slides={items.map((item) => (
        <SectionItem key={item.id} item={item} sizes="(min-width: 768px) 768px, 100vw" />
      ))}
    />
  );
}
