import Link from "next/link"
import { Facebook, Twitter } from "lucide-react"
import Image from "next/image"

export function Footer() {
  // Debug: Check if CSS variables exist
  if (typeof window !== 'undefined') {
    console.log('CSS Vars:', {
      primary: getComputedStyle(document.documentElement).getPropertyValue('--color-primary'),
      secondary: getComputedStyle(document.documentElement).getPropertyValue('--color-secondary'),
    });
  }
  
  return (
    <footer className="bg-gradient-to-r from-palette-primary to-palette-secondary text-white">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Image 
                src="/pagerodeo-Logo.png" 
                alt="PageRodeo Logo" 
                width={150} 
                height={36}
                className="object-contain"
              />
            </div>
            <p className="text-white/80 max-w-xs leading-relaxed">
              Professional website performance testing and monitoring tool with detailed analytics and AI-powered recommendations.
            </p>
          </div>

          {/* Quick Links - All Main Features */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white text-lg">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className="text-white/80 hover:text-white transition-colors">
                  Performance Test
                </Link>
              </li>
              <li>
                <Link href="/monitor" className="text-white/80 hover:text-white transition-colors">
                  Monitor
                </Link>
              </li>
              <li>
                <Link href="/ssl" className="text-white/80 hover:text-white transition-colors">
                  SSL Check
                </Link>
              </li>
              <li>
                <Link href="/sitemap" className="text-white/80 hover:text-white transition-colors">
                  Sitemap
                </Link>
              </li>
              <li>
                <Link href="/api" className="text-white/80 hover:text-white transition-colors">
                  API Health Checker
                </Link>
              </li>
              <li>
                <Link href="/ai-info" className="text-white/80 hover:text-white transition-colors">
                  AI Analysis
                </Link>
              </li>
              <li>
                <Link href="/links" className="text-white/80 hover:text-white transition-colors">
                  Links Checker
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Features Sections */}
        <div className="mt-8 pt-6 border-t border-white/20">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Performance */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white text-lg">Performance</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/performance" className="text-white/80 hover:text-white transition-colors">
                    Lightning Analysis
                  </Link>
                </li>
                <li>
                  <Link href="/performance" className="text-white/80 hover:text-white transition-colors">
                    AI-Powered Insights
                  </Link>
                </li>
                <li>
                  <Link href="/performance" className="text-white/80 hover:text-white transition-colors">
                    Visual Waterfalls
                  </Link>
                </li>
              </ul>
            </div>

            {/* Monitor */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white text-lg">Monitor</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/monitor-info" className="text-white/80 hover:text-white transition-colors">
                    Status Monitoring
                  </Link>
                </li>
                <li>
                  <Link href="/monitor-info" className="text-white/80 hover:text-white transition-colors">
                    Technical Analysis
                  </Link>
                </li>
                <li>
                  <Link href="/monitor-info" className="text-white/80 hover:text-white transition-colors">
                    Performance Metrics
                  </Link>
                </li>
              </ul>
            </div>

            {/* SSL & Domain */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white text-lg">SSL & Domain</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/ssl-info" className="text-white/80 hover:text-white transition-colors">
                    SSL Certificate
                  </Link>
                </li>
                <li>
                  <Link href="/ssl-info" className="text-white/80 hover:text-white transition-colors">
                    DNS Records
                  </Link>
                </li>
                <li>
                  <Link href="/ssl-info" className="text-white/80 hover:text-white transition-colors">
                    Domain Info
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* New Features Section */}
        <div className="mt-8 pt-6 border-t border-white/20">
          <div className="grid md:grid-cols-4 gap-8">
            {/* API Health Checker */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white text-lg">API Health Checker</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/api-info" className="text-white/80 hover:text-white transition-colors">
                    Auto Discovery
                  </Link>
                </li>
                <li>
                  <Link href="/api-info" className="text-white/80 hover:text-white transition-colors">
                    Real-Time Testing
                  </Link>
                </li>
                <li>
                  <Link href="/api-info" className="text-white/80 hover:text-white transition-colors">
                    Performance Analytics
                  </Link>
                </li>
              </ul>
            </div>

            {/* AI Analysis */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white text-lg">AI Analysis</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/ai-info" className="text-white/80 hover:text-white transition-colors">
                    AI Health Monitoring
                  </Link>
                </li>
                <li>
                  <Link href="/ai-info" className="text-white/80 hover:text-white transition-colors">
                    Model Performance
                  </Link>
                </li>
                <li>
                  <Link href="/ai-info" className="text-white/80 hover:text-white transition-colors">
                    Cost & Usage Tracking
                  </Link>
                </li>
              </ul>
            </div>

            {/* Links Checker */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white text-lg">Links Checker</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/links-info" className="text-white/80 hover:text-white transition-colors">
                    Auto Discovery
                  </Link>
                </li>
                <li>
                  <Link href="/links-info" className="text-white/80 hover:text-white transition-colors">
                    Status Validation
                  </Link>
                </li>
                <li>
                  <Link href="/links-info" className="text-white/80 hover:text-white transition-colors">
                    Troubleshooting Guide
                  </Link>
                </li>
              </ul>
            </div>

            {/* Sitemap */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white text-lg">Sitemap</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/sitemap-info" className="text-white/80 hover:text-white transition-colors">
                    Automatic Crawling
                  </Link>
                </li>
                <li>
                  <Link href="/sitemap-info" className="text-white/80 hover:text-white transition-colors">
                    Visual Structure
                  </Link>
                </li>
                <li>
                  <Link href="/sitemap-info" className="text-white/80 hover:text-white transition-colors">
                    XML Export
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Connect Section */}
        <div className="mt-8 pt-6 border-t border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6">
              <h3 className="font-semibold text-white text-lg">Connect</h3>
              <div className="flex space-x-4">
                <Link href="https://www.facebook.com/pagerodeo" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10">
                  <Facebook className="h-5 w-5" />
                </Link>
                <Link href="https://www.x.com/pagerodeo" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10">
                  <Twitter className="h-5 w-5" />
                </Link>
              </div>
            </div>
            <div className="flex space-x-6">
              <Link href="/about" className="text-white/80 hover:text-white transition-colors font-medium">
                About
              </Link>
              <Link href="/feedback" className="text-white/80 hover:text-white transition-colors font-medium">
                Feedback
              </Link>
              <Link href="/contact" className="text-white/80 hover:text-white transition-colors font-medium">
                Contact
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-white/80">
            © 2024 PageRodeo. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm text-white/80">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
