"use client";
import Link from "next/link"
import { Facebook, Twitter } from "lucide-react"
import Image from "next/image"
import { useTranslation } from "react-i18next"

export function Footer() {
  const { t } = useTranslation();
  
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
            <div className="flex items-center mb-8">
              <Image 
                src="/Pagerodeo-Logo-White.png" 
                alt="PageRodeo Logo" 
                width={300} 
                height={72}
                className="object-contain"
              />
            </div>
            <p className="text-white/80 max-w-xs leading-relaxed mt-4">
              {t('footer.description')}
            </p>
          </div>

          {/* Quick Links - All Main Features */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white text-h4-dynamic">{t('footer.quickLinks')}</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className="text-white/80 hover:text-white transition-colors">
                  {t('footer.performanceTest')}
                </Link>
              </li>
              <li>
                <Link href="/monitor" className="text-white/80 hover:text-white transition-colors">
                  {t('footer.monitor')}
                </Link>
              </li>
              <li>
                <Link href="/ssl" className="text-white/80 hover:text-white transition-colors">
                  {t('footer.sslCheck')}
                </Link>
              </li>
              <li>
                <Link href="/sitemap" className="text-white/80 hover:text-white transition-colors">
                  {t('footer.sitemap')}
                </Link>
              </li>
              <li>
                <Link href="/api" className="text-white/80 hover:text-white transition-colors">
                  {t('footer.apiHealthChecker')}
                </Link>
              </li>
              <li>
                <Link href="/ai-info" className="text-white/80 hover:text-white transition-colors">
                  {t('footer.aiAnalysis')}
                </Link>
              </li>
              <li>
                <Link href="/links" className="text-white/80 hover:text-white transition-colors">
                  {t('footer.linksChecker')}
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
              <h3 className="font-semibold text-white text-h4-dynamic">{t('footer.performance')}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/performance" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.lightningAnalysis')}
                  </Link>
                </li>
                <li>
                  <Link href="/performance" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.aiPoweredInsights')}
                  </Link>
                </li>
                <li>
                  <Link href="/performance" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.visualWaterfalls')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Monitor */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white text-h4-dynamic">{t('footer.monitor')}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/monitor-info" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.statusMonitoring')}
                  </Link>
                </li>
                <li>
                  <Link href="/monitor-info" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.technicalAnalysis')}
                  </Link>
                </li>
                <li>
                  <Link href="/monitor-info" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.performanceMetrics')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* SSL & Domain */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white text-h4-dynamic">{t('footer.sslDomain')}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/ssl-info" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.sslCertificate')}
                  </Link>
                </li>
                <li>
                  <Link href="/ssl-info" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.dnsRecords')}
                  </Link>
                </li>
                <li>
                  <Link href="/ssl-info" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.domainInfo')}
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
              <h3 className="font-semibold text-white text-h4-dynamic">{t('footer.apiHealthChecker')}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/api-info" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.autoDiscovery')}
                  </Link>
                </li>
                <li>
                  <Link href="/api-info" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.realTimeTesting')}
                  </Link>
                </li>
                <li>
                  <Link href="/api-info" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.performanceAnalytics')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* AI Analysis */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white text-h4-dynamic">{t('footer.aiAnalysis')}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/ai-info" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.aiHealthMonitoring')}
                  </Link>
                </li>
                <li>
                  <Link href="/ai-info" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.modelPerformance')}
                  </Link>
                </li>
                <li>
                  <Link href="/ai-info" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.costUsageTracking')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Links Checker */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white text-h4-dynamic">{t('footer.linksChecker')}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/links-info" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.autoDiscovery')}
                  </Link>
                </li>
                <li>
                  <Link href="/links-info" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.statusValidation')}
                  </Link>
                </li>
                <li>
                  <Link href="/links-info" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.troubleshootingGuide')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Sitemap */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white text-h4-dynamic">{t('footer.sitemap')}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/sitemap-info" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.automaticCrawling')}
                  </Link>
                </li>
                <li>
                  <Link href="/sitemap-info" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.visualStructure')}
                  </Link>
                </li>
                <li>
                  <Link href="/sitemap-info" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.xmlExport')}
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
              <h3 className="font-semibold text-white text-h4-dynamic">{t('footer.connect')}</h3>
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
                {t('footer.about')}
              </Link>
              <Link href="/affiliate" className="text-white/80 hover:text-white transition-colors font-medium">
                Affiliates
              </Link>
              <Link href="/marketing" className="text-white/80 hover:text-white transition-colors font-medium">
                Deals
              </Link>
              <Link href="/feedback" className="text-white/80 hover:text-white transition-colors font-medium">
                {t('footer.feedback')}
              </Link>
              <Link href="/contact" className="text-white/80 hover:text-white transition-colors font-medium">
                {t('footer.contact')}
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-white/80">
            {t('footer.copyright')}
          </p>
          <div className="flex space-x-6 text-sm text-white/80">
            <Link href="/privacy" className="hover:text-white transition-colors">{t('footer.privacyPolicy')}</Link>
            <Link href="/terms" className="hover:text-white transition-colors">{t('footer.termsOfService')}</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">{t('footer.cookiePolicy')}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
