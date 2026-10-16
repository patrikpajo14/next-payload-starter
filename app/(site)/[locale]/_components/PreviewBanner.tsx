import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

import { getLocale, getMessages } from "@/lib/i18n/server";

/**
 * Tells an Editor in Draft Mode that they see Drafts, and lets them leave it.
 * Draft Mode outlives the admin tab (until the browser closes), so without this
 * an Editor could take a Draft for published content.
 */
export async function PreviewBanner() {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return null;
  const locale = await getLocale();
  const t = await getMessages();

  // `getLocale()` reads the request's route params, which a Server Action
  // doesn't have, so the Locale is read here and the action closes over it.
  async function exitPreview() {
    "use server";
    (await draftMode()).disable();
    redirect(`/${locale}`);
  }

  return (
    <aside
      role="status"
      className="flex flex-wrap items-center justify-center gap-3 bg-amber-100 px-4 py-2 text-sm text-amber-950"
    >
      {t.previewNotice}
      <form action={exitPreview}>
        <button type="submit" className="underline">
          {t.exitPreview}
        </button>
      </form>
    </aside>
  );
}
