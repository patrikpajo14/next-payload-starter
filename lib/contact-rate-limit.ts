import type { Payload } from "payload";

/** Contact Submissions one Visitor (one `ipHash`) may store per window. */
export const CONTACT_RATE_LIMIT = 5;

const WINDOW_MS = 60 * 60 * 1000;

/**
 * Whether a Visitor has already stored the limit of Contact Submissions in the
 * last hour. Counts stored rows, so it needs no cache or service and holds
 * across Vercel instances and containers.
 *
 * The `ipHash` is personal data: it is kept only for this check and for
 * spotting abuse. Editors delete Contact Submissions (and their hashes) once
 * they are answered; none should outlive the retention the privacy policy states.
 */
export async function isContactRateLimited(
  payload: Payload,
  ipHash: string,
  now: Date = new Date(),
): Promise<boolean> {
  const since = new Date(now.getTime() - WINDOW_MS).toISOString();
  const { totalDocs } = await payload.count({
    collection: "contact-submissions",
    where: { ipHash: { equals: ipHash }, createdAt: { greater_than: since } },
    // Counting is not reading the rows: the action is trusted, and `ipHash`
    // has no read access for anyone else.
    overrideAccess: true,
  });
  return totalDocs >= CONTACT_RATE_LIMIT;
}
