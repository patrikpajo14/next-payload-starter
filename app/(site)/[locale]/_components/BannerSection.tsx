import Image from "next/image";
import Link from "next/link";

import type { Locale } from "@/lib/i18n/locales";
import { articlePath } from "@/lib/url-segments";
import type { BannerSection as Banner } from "@/payload-types";

/**
 * A Banner Section, as wide as the window: it breaks out of the Page's text
 * column. Empty fields are skipped, the CTA needs both its label and a linkable
 * Article, and a Banner with nothing left renders nothing. Text and CTA sit over
 * the image, or on a plain background without one.
 */
export function BannerSection({ banner, locale }: { banner: Banner; locale: Locale }) {
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
  const href = articlePath(locale, banner.cta?.article);
  const cta = banner.cta?.label && href ? { label: banner.cta.label, href } : null;
  if (!image && !banner.text && !cta) return null;

  const content =
    banner.text || cta ? (
      <div
        className={`flex flex-col items-center justify-center gap-4 p-6 text-center ${
          image ? "absolute inset-0 bg-black/50 text-white" : "bg-neutral-100 py-12"
        }`}
      >
        {banner.text ? (
          <p className="max-w-2xl whitespace-pre-line text-xl">{banner.text}</p>
        ) : null}
        {cta ? (
          <Link
            href={cta.href}
            className="rounded bg-white px-5 py-2 font-medium text-black ring-1 ring-black/20"
          >
            {cta.label}
          </Link>
        ) : null}
      </div>
    ) : null;

  return (
    // `margin-inline` pulls the Section out to the window's edges; the body clips overflow.
    <section className="relative [margin-inline:calc(50%-50vw)]">
      {image ? (
        <Image
          src={image.url}
          alt={image.alt ?? ""}
          width={image.width}
          height={image.height}
          sizes="100vw"
          className="h-72 w-full object-cover sm:h-96"
        />
      ) : null}
      {content}
    </section>
  );
}
