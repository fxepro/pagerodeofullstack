import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Network, 
  Globe, 
  Download, 
  Clock, 
  Target, 
  TrendingUp, 
  Shield, 
  CheckCircle,
  ArrowRight,
  BookOpen,
  Lightbulb,
  Gauge,
  Activity,
  Eye,
  FileText,
  Wifi,
  AlertTriangle,
  Search,
  Map
} from "lucide-react"
import Link from "next/link"

export default function SitemapInfoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-r from-palette-primary to-palette-secondary text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Sitemap Analysis
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto mb-8 leading-relaxed">
              Comprehensive website crawling and sitemap generation with automatic discovery, 
              visual structure mapping, and XML export capabilities.
            </p>
            <div className="flex justify-center">
              <Button size="lg" className="bg-white text-palette-primary hover:bg-palette-accent-3">
                <Network className="h-5 w-5 mr-2" />
                Start Sitemap Analysis
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Overview */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Sitemap Capabilities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three powerful sitemap tools working together to map and analyze your website's structure
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Automatic Crawling */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Network className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Automatic Crawling</h3>
                  <p className="text-slate-600 mb-4">
                    Intelligent website crawling that automatically discovers and maps all pages.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Intelligent page discovery
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Complete site mapping
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Real-time crawling
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Visual Structure */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Visual Structure</h3>
                  <p className="text-slate-600 mb-4">
                    Interactive visual representation of your website's hierarchical structure.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Hierarchical mapping
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Interactive navigation
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Depth analysis
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* XML Export */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Download className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">XML Export</h3>
                  <p className="text-slate-600 mb-4">
                    Generate and export standard XML sitemaps for search engines.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Standard XML format
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      SEO optimization
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Search engine ready
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Detailed Capabilities */}
      <section className="py-16 px-4 bg-gradient-to-br from-slate-50 to-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Detailed Capabilities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Deep dive into each sitemap tool and understand how they work together
            </p>
          </div>

          <div className="space-y-16">
            {/* Automatic Crawling Details */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center">
                  <Network className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Automatic Crawling</h3>
                  <p className="text-gray-600">Intelligent website discovery and mapping</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">What is Automatic Crawling?</h4>
                  <p className="text-gray-600 mb-4">
                    Automatic Crawling uses intelligent algorithms to discover and map all pages on your website. 
                    It follows internal links, analyzes page structure, and builds a comprehensive map of your 
                    site's content without requiring manual input or configuration.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Our crawling system respects robots.txt files, handles dynamic content, and can navigate 
                    complex site structures including JavaScript-rendered pages. It provides real-time crawling 
                    with detailed progress tracking and error handling.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-palette-accent-1" />
                      Intelligent page discovery
                    </li>
                    <li className="flex items-center gap-2">
                      <Map className="h-4 w-4 text-palette-accent-1" />
                      Complete site mapping
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-palette-accent-1" />
                      Real-time crawling
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-palette-accent-1" />
                      Robots.txt compliance
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-r from-palette-accent-3 to-blue-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Reading Material</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Website Crawling Best Practices:</strong> Optimizing your site for discovery
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Internal Linking Strategies:</strong> Creating crawlable site structures
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Dynamic Content Crawling:</strong> Handling JavaScript and AJAX content
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Structure Details */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Visual Structure</h3>
                  <p className="text-gray-600">Interactive hierarchical website mapping</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">What is Visual Structure Mapping?</h4>
                  <p className="text-gray-600 mb-4">
                    Visual Structure Mapping creates an interactive, hierarchical representation of your website's 
                    architecture. It shows the relationships between pages, content depth, and navigation patterns 
                    in an easy-to-understand visual format.
                  </p>
                  <p className="text-gray-600 mb-4">
                    This visualization helps you understand your site's organization, identify content gaps, 
                    and optimize navigation structure. It's particularly useful for large websites with complex 
                    hierarchies and multiple content categories.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <Map className="h-4 w-4 text-palette-accent-1" />
                      Hierarchical mapping
                    </li>
                    <li className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-palette-accent-1" />
                      Interactive navigation
                    </li>
                    <li className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-palette-accent-1" />
                      Depth analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-palette-accent-1" />
                      Content relationship mapping
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-r from-palette-accent-3 to-blue-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Reading Material</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Website Architecture Design:</strong> Creating logical site structures
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Navigation Optimization:</strong> Improving user experience through structure
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Content Hierarchy Planning:</strong> Organizing information effectively
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* XML Export Details */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center">
                  <Download className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">XML Export</h3>
                  <p className="text-gray-600">Standard XML sitemap generation and export</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">What is XML Export?</h4>
                  <p className="text-gray-600 mb-4">
                    XML Export generates standard XML sitemaps that are compatible with search engines like Google, 
                    Bing, and Yahoo. These sitemaps help search engines discover, crawl, and index your website's 
                    content more effectively.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Our XML export includes proper metadata like last modification dates, change frequencies, 
                    and priority values. It follows the XML Sitemap protocol and can be submitted directly to 
                    search engines for improved SEO performance.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-palette-accent-1" />
                      Standard XML format
                    </li>
                    <li className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-palette-accent-1" />
                      SEO optimization
                    </li>
                    <li className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-palette-accent-1" />
                      Search engine ready
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-palette-accent-1" />
                      Metadata inclusion
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-r from-palette-accent-3 to-blue-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Reading Material</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>XML Sitemap Guide:</strong> Creating effective sitemaps for SEO
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Search Engine Submission:</strong> Getting your sitemap indexed
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Sitemap Maintenance:</strong> Keeping your sitemaps current and accurate
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-palette-primary to-palette-secondary text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Analyze Your Sitemap?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Get comprehensive sitemap analysis with automatic crawling, visual structure mapping, and XML export.
          </p>
          <div className="flex justify-center">
            <Button size="lg" className="bg-white text-palette-primary hover:bg-palette-accent-3">
              <Network className="h-5 w-5 mr-2" />
              Start Sitemap Analysis
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
