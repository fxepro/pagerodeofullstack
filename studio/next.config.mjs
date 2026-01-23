/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Temporarily ignore ESLint during builds
  },
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore TypeScript errors
  },
  webpack: (config, { isServer, dev }) => {
    // CACHE DISABLING FOR DEVELOPMENT (but keep webpack cache for chunk serving)
    if (dev) {
      // Use 'named' IDs - forces recompilation on every change
      config.optimization = {
        ...config.optimization,
        moduleIds: 'named',
        chunkIds: 'named',
        // Disable module concatenation which can cause cache issues
        concatenateModules: false,
        minimize: false,
      };
      
      // DO NOT disable config.cache completely - it breaks chunk serving
      // Use filesystem cache with minimal configuration
      // Note: buildDependencies removed to avoid __filename issue in ES modules
      config.cache = {
        type: 'filesystem',
        // Shorter cache time - forces more frequent cache invalidation
        maxAge: 1000, // 1 second cache
      };
    } else {
      // Production: use deterministic IDs for better caching
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
      };
    }
    
    return config;
  },
  images: {
    unoptimized: true,
  },
  // Disable build ID generation in development to prevent cache confusion
  ...(process.env.NODE_ENV === 'development' ? {} : {
    generateBuildId: async () => {
      return process.env.BUILD_ID || null;
    },
  }),
  // AGGRESSIVE CACHE DISABLING
  experimental: {
    // Disable Turbo cache - must be an object, not boolean
    turbo: {
      resolveAlias: {},
    },
  },
  // Minimize page caching in development
  onDemandEntries: {
    // Very short cache time - pages expire quickly
    maxInactiveAge: 5 * 1000, // 5 seconds instead of 25
    // Keep minimal pages in buffer
    pagesBufferLength: 1, // Only 1 page instead of 2
  },
  async rewrites() {
    // Only use rewrites in development - Apache handles routing in production
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    return [
      {
        source: '/api/sitemap',
        destination: 'http://localhost:8000/api/sitemap/',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
}

export default nextConfig
