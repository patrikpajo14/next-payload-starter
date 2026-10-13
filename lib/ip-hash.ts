import { createHash } from "node:crypto";

/**
 * Salted SHA-256 of a Visitor's IP address, as hex. Contact Submissions keep
 * this instead of the address: Editors can't read it back, but the same
 * Visitor hashes to the same value for the same salt.
 */
export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/**
 * The Visitor's address as the proxy in front of the app reports it: the first
 * `x-forwarded-for` entry, else `x-real-ip`. `undefined` when neither is set.
 */
export function clientIp(headers: Headers): string | undefined {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || undefined;
}
