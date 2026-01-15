import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true, // often necessary for rapid deployment tests
  },
  images: {
    unoptimized: true, // simpler for docker
  }
};

export default nextConfig;
