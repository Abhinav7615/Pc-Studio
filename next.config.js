const nextConfig = {
  staticPageGenerationTimeout: 120,
  webpack: (config) => {
    config.optimization.moduleIds = 'deterministic';
    return config;
  },
};

module.exports = nextConfig;
