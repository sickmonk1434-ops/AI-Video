import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["edge-tts"],
  images: {
    unoptimized: true,
  }
};

export default nextConfig;
