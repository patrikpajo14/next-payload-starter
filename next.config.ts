import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

import { locales } from "./lib/i18n/locales";

const nextConfig: NextConfig = {
  images: {
    // Only Payload's media files are optimized; every other local path is refused.
    localPatterns: [{ pathname: "/api/media/file/**", search: "" }],
  },
  async redirects() {
    return [
      {
        // Article List page 1 has one address, without a number. A config
        // redirect is the only way to send a real 301: `redirect()` and
        // `permanentRedirect()` in a Page send 307 and 308.
        source: `/:locale(${locales.join("|")})/:seoName/1`,
        destination: "/:locale/:seoName",
        statusCode: 301,
      },
    ];
  },
};

export default withPayload(nextConfig);
