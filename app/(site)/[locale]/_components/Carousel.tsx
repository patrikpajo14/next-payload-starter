"use client";

import { useState } from "react";
import type { ReactNode } from "react";

/**
 * Shows one slide at a time with Previous and Next buttons, following the WAI
 * carousel pattern. Without JavaScript, only the first slide shows.
 */
export function Carousel({
  label,
  heading,
  previousLabel,
  nextLabel,
  slides,
}: {
  label: string;
  heading?: ReactNode;
  previousLabel: string;
  nextLabel: string;
  slides: ReactNode[];
}) {
  const [selected, setCurrent] = useState(0);
  const count = slides.length;
  // A revalidated Page can bring fewer slides than the one selected.
  const current = Math.min(selected, count - 1);

  return (
    <section aria-roledescription="carousel" aria-label={label} className="flex flex-col gap-6">
      {heading}
      <div aria-live="polite">
        {slides.map((slide, index) => (
          <div
            key={index}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} / ${count}`}
            hidden={index !== current}
          >
            {slide}
          </div>
        ))}
      </div>
      {count > 1 ? (
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label={previousLabel}
            disabled={current === 0}
            onClick={() => setCurrent(current - 1)}
            className="rounded border px-3 py-1 disabled:opacity-40"
          >
            ←
          </button>
          <span aria-hidden="true">
            {current + 1} / {count}
          </span>
          <button
            type="button"
            aria-label={nextLabel}
            disabled={current === count - 1}
            onClick={() => setCurrent(current + 1)}
            className="rounded border px-3 py-1 disabled:opacity-40"
          >
            →
          </button>
        </div>
      ) : null}
    </section>
  );
}
