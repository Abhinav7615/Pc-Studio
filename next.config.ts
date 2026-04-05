import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  staticPageGenerationTimeout: 120,
  webpack: (config) => {
    config.optimization.moduleIds = 'deterministic';
    return config;
  },
};

export default nextConfig;
