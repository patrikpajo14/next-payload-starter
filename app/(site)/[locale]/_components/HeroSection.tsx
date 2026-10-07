import Image from "next/image";

import type { HeroSection as Hero } from "@/payload-types";

/**
 * A Hero Section. Empty fields are skipped, and a Hero with none filled
 * renders nothing. `priority` marks the first Section, the largest image above
 * the fold.
 */
export function HeroSection({ hero, priority }: { hero: Hero; priority: boolean }) {
  const image =
    typeof hero.image === "object" && hero.image?.url && hero.image.width && hero.image.height
      ? { ...hero.image, url: hero.image.url, width: hero.image.width, height: hero.image.height }
      : null;
  if (!image && !hero.heading && !hero.text) return null;

  return (
    <section className="flex flex-col gap-6">
      {image ? (
        <Image
          src={image.url}
          alt={image.alt ?? ""}
          width={image.width}
          height={image.height}
          sizes="(min-width: 768px) 768px, 100vw"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          className="h-auto w-full rounded"
        />
      ) : null}
      {hero.heading ? <h2 className="text-3xl font-semibold">{hero.heading}</h2> : null}
      {hero.text ? <p className="whitespace-pre-line text-lg">{hero.text}</p> : null}
    </section>
  );
}
