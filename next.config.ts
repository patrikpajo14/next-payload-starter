import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  images: {
    // Only Payload's media files are optimized; every other local path is refused.
    localPatterns: [{ pathname: "/api/media/file/**", search: "" }],
  },
};

export default withPayload(nextConfig);
