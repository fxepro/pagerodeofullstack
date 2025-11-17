/** @type {import('next').NextConfig} */
const nextConfig = {
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
    // In development, Next.js API routes in app/api/ are handled automatically.
    // Only proxy specific Django routes that don't conflict with Next.js routes.
    // 
    // Next.js API routes (handled by Next.js, NOT rewritten):
    // - /api/analyze, /api/analyze-device, /api/dns, /api/ssl, /api/links
    // - /api/ai-analyze, /api/ai-health/*, /api/ai-question
    // - /api/monitor/*, /api/typography, /api/sitemap, /api/test-errors
    //
    // Django API routes (proxied to Django):
    // - /api/auth/*, /api/user-info/, /api/palettes/*, /api/site-config/*
    // - /api/reports/*, /api/monitoring/*, etc.
    
    return [
      {
        source: '/admin/:path*',
        destination: 'http://localhost:8000/admin/:path*',
      },
      // Only rewrite Django-specific routes, not Next.js routes
      // The catch-all is removed - Next.js will handle its own routes first
      // Django routes will be called directly via getDjangoApiUrl() in the frontend
    ];
  },
}

export default nextConfig
