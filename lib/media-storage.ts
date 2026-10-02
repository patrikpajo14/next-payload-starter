import { s3Storage } from "@payloadcms/storage-s3";
import type { Plugin } from "payload";

import { Media } from "../collections/Media";

const S3_VARIABLES = [
  "S3_BUCKET",
  "S3_ENDPOINT",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
] as const;

/**
 * Where uploaded media is stored.
 *
 * With `S3_BUCKET` set (production and the demo), files go to an S3-compatible
 * bucket such as Cloudflare R2. Without it (development and tests), Payload
 * keeps them on local disk in `media/`. A partial S3 setup throws at startup
 * rather than silently falling back to a disk that a deployment may wipe.
 */
export function mediaStorage(
  env: Record<string, string | undefined> = process.env,
): Plugin {
  const enabled = Boolean(env.S3_BUCKET);

  if (enabled) {
    const missing = S3_VARIABLES.filter((name) => !env[name]);
    if (missing.length > 0) {
      throw new Error(
        `S3_BUCKET is set but ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} not. See .env.example.`,
      );
    }
  }

  return s3Storage({
    enabled,
    collections: { [Media.slug]: true },
    bucket: env.S3_BUCKET ?? "",
    config: {
      endpoint: env.S3_ENDPOINT,
      // R2 ignores the region but the AWS client requires one.
      region: env.S3_REGION ?? "auto",
      // Newer AWS SDKs add checksum headers to every upload, which R2 has
      // rejected; send them only when an operation requires one.
      requestChecksumCalculation: "WHEN_REQUIRED",
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: env.S3_SECRET_ACCESS_KEY ?? "",
      },
    },
  });
}
