import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "mc-heads.net" },
      { protocol: "https", hostname: "cravatar.eu" },
      { protocol: "https", hostname: "static.tebex.io" },
      { protocol: "https", hostname: "cdn.tebex.io" },
      { protocol: "https", hostname: "dunb17ur4ymx4.cloudfront.net" },
      { protocol: "https", hostname: "imgur.com" },
      { protocol: "https", hostname: "i.imgur.com" }
    ],
  },
};

export default nextConfig;
