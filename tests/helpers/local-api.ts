/**
 * Options for Local API writes from tests and seeds: they bypass access
 * control, and skip revalidation, which only works inside a running Next.js server.
 */
export const testWrite = { overrideAccess: true, context: { disableRevalidate: true } } as const;
