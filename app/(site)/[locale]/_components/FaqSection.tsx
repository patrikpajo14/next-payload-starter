import type { FaqSection as Faq } from "@/payload-types";

/**
 * A heading over questions with expandable answers, as native disclosure
 * widgets: keyboard and screen-reader support come with `<details>`. Items
 * missing a question or an answer are skipped, and a Section with none left
 * renders nothing.
 */
export function FaqSection({ faq }: { faq: Faq }) {
  const items = (faq.items ?? []).filter((item) => item.question && item.answer);
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-6">
      {faq.heading ? <h2 className="text-2xl font-semibold">{faq.heading}</h2> : null}
      <div className="flex flex-col divide-y rounded border">
        {items.map((item) => (
          <details key={item.id} className="group px-4 py-3">
            <summary className="cursor-pointer font-medium">{item.question}</summary>
            <p className="mt-2 whitespace-pre-line">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
