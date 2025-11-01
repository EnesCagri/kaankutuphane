import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  eslint: {
    // ESLint hatalarını build sırasında görmezden gel
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
