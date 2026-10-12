/**
 * Reads an environment variable the app cannot run without. Throws a message
 * naming it, so a missing secret fails at startup instead of signing sessions
 * with an empty key or connecting to nowhere.
 */
export function requireEnv(
  name: string,
  env: Record<string, string | undefined> = process.env,
): string {
  const value = env[name];
  if (!value?.trim()) {
    throw new Error(`${name} is not set. Add it to your environment (see .env.example).`);
  }
  return value;
}
