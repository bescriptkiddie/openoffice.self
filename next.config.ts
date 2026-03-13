import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: [],
  turbopack: {
    root: '.',
  },
};

export default nextConfig;
