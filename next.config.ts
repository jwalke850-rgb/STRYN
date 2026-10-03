import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Session transcripts can be long.
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
