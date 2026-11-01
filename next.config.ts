import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: "http://16.178.137.42/citydeals/api/:path*",
      },
    ];
  },
};

export default nextConfig;
