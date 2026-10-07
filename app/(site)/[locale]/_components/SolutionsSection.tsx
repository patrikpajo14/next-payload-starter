import type { SolutionsSection as Solutions } from "@/payload-types";

import { SectionItem, visibleItems } from "./SectionItem";

/**
 * A heading over a grid of solutions. Solutions without a title are skipped,
 * and a Section with none left renders nothing.
 */
export function SolutionsSection({ solutions }: { solutions: Solutions }) {
  const items = visibleItems(solutions.items);
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-6">
      {solutions.heading ? <h2 className="text-2xl font-semibold">{solutions.heading}</h2> : null}
      <ul className="grid gap-8 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id}>
            <SectionItem item={item} sizes="(min-width: 640px) 368px, 100vw" />
          </li>
        ))}
      </ul>
    </section>
  );
}
