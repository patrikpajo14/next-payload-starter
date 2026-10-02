import Link from "next/link";

interface EditorLink {
  id?: string | null;
  label: string;
  url: string;
}

/** An Editor-managed list of links, or nothing when the list is empty. */
export function LinkList({ label, links }: { label: string; links?: EditorLink[] | null }) {
  if (!links || links.length === 0) return null;

  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap gap-4">
        {links.map((link) => (
          <li key={link.id ?? link.url}>
            <Link href={link.url} className="underline">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
