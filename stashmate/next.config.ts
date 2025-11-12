import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Increase the body size limit for API routes (default is 1mb)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', 
    },
  },
};

export default nextConfig;
