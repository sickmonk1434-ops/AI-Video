import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
  transpilePackages: ["edge-tts"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
