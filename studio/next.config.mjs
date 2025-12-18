/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Temporarily ignore ESLint during builds
  },
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore TypeScript errors
  },
  webpack: (config, { isServer }) => {
    // Increase memory limit for webpack
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
    };
    return config;
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    // Only use rewrites in development - nginx handles routing in production
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
      // Note: Django admin should be accessed directly at http://localhost:8000/django-admin/
      // to avoid redirect loops. Next.js rewrites don't handle Django's APPEND_SLASH redirects well.
    ];
  },
}

export default nextConfig
