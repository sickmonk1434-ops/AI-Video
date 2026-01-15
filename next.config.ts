import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  }
};

export default nextConfig;
