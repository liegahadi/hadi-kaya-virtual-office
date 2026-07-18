import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Include .z-ai-config in standalone build (z-ai-web-dev-sdk reads it at runtime via fs.readFile)
  outputFileTracingIncludes: {
    '/': ['./.z-ai-config'],
  },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
