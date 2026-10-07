import Image from "next/image";
import Link from "next/link";

import type { SectionItem as Items } from "@/payload-types";

/** One item held inline in a Section, such as a product or a solution. */
type Item = NonNullable<Items>[number];

/** An item with the title every shown item needs. */
type TitledItem = Item & { title: string };

/** The items that have a title in this Locale; the rest are skipped. */
export function visibleItems(items: Items | undefined): TitledItem[] {
  return (items ?? []).filter((item): item is TitledItem => Boolean(item.title));
}

/** An item's image, title, text, and link. Empty fields are skipped. */
export function SectionItem({ item, sizes }: { item: TitledItem; sizes: string }) {
  const image = typeof item.image === "object" ? item.image : null;
  const link =
    item.link?.label && item.link.url ? { label: item.link.label, url: item.link.url } : null;

  return (
    <div className="flex flex-col gap-3">
      {image?.url && image.width && image.height ? (
        <Image
          src={image.url}
          alt={image.alt ?? ""}
          width={image.width}
          height={image.height}
          sizes={sizes}
          className="h-auto w-full rounded"
        />
      ) : null}
      <h3 className="text-xl font-semibold">{item.title}</h3>
      {item.text ? <p className="whitespace-pre-line">{item.text}</p> : null}
      {link ? (
        <Link href={link.url} className="underline">
          {link.label}
        </Link>
      ) : null}
    </div>
  );
}
