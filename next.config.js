const nextConfig = {
  // Performance optimizations
  staticPageGenerationTimeout: 120,
  
  // Optimize webpack
  webpack: (config) => {
    config.optimization.moduleIds = 'deterministic';
    return config;
  },
  
  // Image optimization settings
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    disableStaticImages: false,
  },
  
  // Enable compression
  compress: true,
  
  // Experimental features for performance
  experimental: {
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-icons',
      'react-icons',
      'framer-motion'
    ],
  },
};

module.exports = nextConfig;
