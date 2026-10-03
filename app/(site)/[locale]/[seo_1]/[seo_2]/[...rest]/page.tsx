import { notFound } from "next/navigation";

// Any path no other route claims is a localized 404.
export default function UnknownPath() {
  notFound();
}
