import type { NextConfig } from "next";
import path from "node:path";

const ONE_YEAR = 60 * 60 * 24 * 365;

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/brand/:path*",
        headers: [
          { key: "Cache-Control", value: `public, max-age=${ONE_YEAR}, immutable` },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: `public, max-age=${ONE_YEAR}, immutable` },
        ],
      },
      {
        source: "/icon.svg",
        headers: [
          { key: "Cache-Control", value: `public, max-age=${ONE_YEAR}, immutable` },
        ],
      },
    ];
  },
};

export default nextConfig;
