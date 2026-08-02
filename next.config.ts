import type { NextConfig } from "next";
import path from "node:path";

const ONE_YEAR = 60 * 60 * 24 * 365;
const ONE_HOUR = 60 * 60;
const isDevelopment = process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self' data:",
  `connect-src 'self'${isDevelopment ? " ws: wss:" : ""}`,
  // CMS content supports iframe embeds. Keep the allowlist deliberately narrow.
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "0" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value:
      "browsing-topics=(), camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    formats: ["image/avif", "image/webp"],
    localPatterns: [
      { pathname: "/brand/**" },
      { pathname: "/images/**" },
      { pathname: "/uploads/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/brand/:path*",
        headers: [
          { key: "Cache-Control", value: `public, max-age=${ONE_YEAR}, immutable` },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: `public, max-age=${ONE_HOUR}, stale-while-revalidate=86400`,
          },
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
