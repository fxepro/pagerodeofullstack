import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: __dirname,
  eslint: {
    ignoreDuringBuilds: false, // Enable ESLint during builds
  },
  typescript: {
    ignoreBuildErrors: false, // Enable TypeScript error checking during builds
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
      {
        source: '/admin/:path*',
        destination: 'http://localhost:8000/admin/:path*',
      },
    ];
  },
}

export default nextConfig
