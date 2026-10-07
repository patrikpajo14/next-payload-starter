import Image from "next/image";
import Link from "next/link";

import type { BannerSection as Banner } from "@/payload-types";

/**
 * A full-width image with text and a call-to-action button. Empty fields are
 * skipped, a CTA needs both its label and URL, and a Banner with nothing left
 * renders nothing.
 */
export function BannerSection({ banner }: { banner: Banner }) {
  const image =
    typeof banner.image === "object" &&
    banner.image?.url &&
    banner.image.width &&
    banner.image.height
      ? {
          ...banner.image,
          url: banner.image.url,
          width: banner.image.width,
          height: banner.image.height,
        }
      : null;
  const cta =
    banner.cta?.label && banner.cta.url ? { label: banner.cta.label, url: banner.cta.url } : null;
  if (!image && !banner.text && !cta) return null;

  return (
    <section className="flex flex-col gap-6">
      {image ? (
        <Image
          src={image.url}
          alt={image.alt ?? ""}
          width={image.width}
          height={image.height}
          sizes="(min-width: 768px) 768px, 100vw"
          className="h-auto w-full rounded"
        />
      ) : null}
      {banner.text ? <p className="whitespace-pre-line text-lg">{banner.text}</p> : null}
      {cta ? (
        <Link
          href={cta.url}
          className="self-start rounded bg-black px-5 py-2 font-medium text-white"
        >
          {cta.label}
        </Link>
      ) : null}
    </section>
  );
}
