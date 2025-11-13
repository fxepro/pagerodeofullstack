import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Link2, 
  Globe, 
  Zap, 
  BarChart3, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Server,
  FileText,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Target,
  Activity,
  Wifi,
  Eye,
  Search
} from "lucide-react"
import Link from "next/link"

export function LinksInfoMain() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-r from-palette-primary to-palette-secondary text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Broken Link Checker
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto mb-8 leading-relaxed">
              Comprehensive link health monitoring with automatic discovery, status validation, 
              and detailed performance analytics for all your website links.
            </p>
            <div className="flex justify-center">
              <Button size="lg" className="bg-white text-palette-primary hover:bg-palette-accent-3">
                <Link2 className="h-5 w-5 mr-2" />
                Start Link Checking
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
              Link Checking Capabilities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three essential link monitoring tools working together to ensure your website links are healthy and accessible
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Auto Discovery */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Search className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Auto Discovery</h3>
                  <p className="text-slate-600 mb-4">
                    Automatically crawl your website to discover all internal and external links for comprehensive testing.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      HTML link extraction
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      URL normalization
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Link categorization
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Status Validation */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Status Validation</h3>
                  <p className="text-slate-600 mb-4">
                    Test each link's HTTP status code to identify broken links, redirects, and accessibility issues.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      HTTP status checking
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Error detection
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Redirect tracking
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Performance Analytics */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Performance Analytics</h3>
                  <p className="text-slate-600 mb-4">
                    Comprehensive performance metrics and analytics to optimize your website's link structure.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Response time tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Success rate analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Detailed reporting
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
              Deep dive into each link checking capability and understand how they work together
            </p>
          </div>

          <div className="space-y-16">
            {/* Auto Discovery Details */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Auto Discovery</h3>
                  <p className="text-gray-600">Intelligent link discovery and extraction from web pages</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">What is Auto Discovery?</h4>
                  <p className="text-gray-600 mb-4">
                    Auto Discovery uses advanced web crawling techniques to find all links on your website. 
                    It analyzes HTML content, extracts href attributes, and normalizes URLs to create a 
                    comprehensive list of both internal and external links.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Our system intelligently filters out non-essential links like email addresses, phone numbers, 
                    JavaScript links, and file downloads to focus on actual web pages that need to be tested. 
                    This ensures you get accurate and actionable results.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-palette-accent-1" />
                      HTML link extraction
                    </li>
                    <li className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-palette-accent-1" />
                      URL normalization
                    </li>
                    <li className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-palette-accent-1" />
                      Link categorization
                    </li>
                    <li className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-palette-accent-1" />
                      Duplicate removal
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
                      <strong>Web Crawling Best Practices:</strong> Ethical and efficient website crawling techniques
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>URL Normalization:</strong> Standardizing web addresses for consistent testing
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Link Architecture:</strong> Designing effective internal linking structures
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Validation Details */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Status Validation</h3>
                  <p className="text-gray-600">Comprehensive HTTP status checking and error detection</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">What is Status Validation?</h4>
                  <p className="text-gray-600 mb-4">
                    Status Validation performs HTTP HEAD requests to each discovered link, checking response 
                    codes and measuring response times. This process identifies broken links (404 errors), 
                    server errors (5xx), redirects (3xx), and successful responses (2xx).
                  </p>
                  <p className="text-gray-600 mb-4">
                    Our validation system handles various edge cases including timeouts, network errors, 
                    and malformed URLs. It provides detailed error messages and categorizes links by their 
                    status to help you prioritize fixes and understand your website's link health.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-palette-accent-1" />
                      HTTP status checking
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-palette-accent-1" />
                      Error detection
                    </li>
                    <li className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-palette-accent-1" />
                      Redirect tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-palette-accent-1" />
                      Response time measurement
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
                      <strong>HTTP Status Codes Guide:</strong> Understanding web server response codes
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Link Maintenance Strategies:</strong> Keeping your website links healthy and functional
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Error Handling Best Practices:</strong> Implementing robust error detection systems
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Analytics Details */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Performance Analytics</h3>
                  <p className="text-gray-600">Comprehensive performance metrics and detailed reporting</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">What are Performance Analytics?</h4>
                  <p className="text-gray-600 mb-4">
                    Performance Analytics provides detailed insights into your website's link performance 
                    characteristics. This includes response time measurements, success rates, error analysis, 
                    and comprehensive reporting to help you optimize your website's link structure.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Our analytics system categorizes links by type (internal vs external), tracks performance 
                    trends, and identifies slow or problematic links. This data helps you make informed decisions 
                    about link optimization and website maintenance priorities.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-palette-accent-1" />
                      Response time tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-palette-accent-1" />
                      Success rate analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-palette-accent-1" />
                      Error reporting
                    </li>
                    <li className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-palette-accent-1" />
                      Performance trends
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
                      <strong>Link Performance Metrics:</strong> Understanding key performance indicators for website links
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Website Maintenance:</strong> Proactive strategies for keeping links healthy
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>SEO and Link Health:</strong> How broken links affect search engine optimization
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Troubleshooting Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Troubleshooting Broken Links
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Understanding common link errors and how to fix them effectively
            </p>
          </div>

          <Card className="border-orange-200 shadow-xl">
            <CardHeader className="bg-orange-50">
              <CardTitle className="text-xl font-bold text-orange-800 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6" />
                Common HTTP Status Codes & Solutions
              </CardTitle>
              <CardDescription className="text-orange-700">
                Reference guide for diagnosing and fixing broken links
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-orange-100 border-b border-orange-200">
                    <tr>
                      <th className="text-left p-4 font-semibold text-orange-800">Status Code</th>
                      <th className="text-left p-4 font-semibold text-orange-800">Error Type</th>
                      <th className="text-left p-4 font-semibold text-orange-800">What It Means</th>
                      <th className="text-left p-4 font-semibold text-orange-800">How to Fix</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-orange-100 hover:bg-orange-50">
                      <td className="p-4">
                        <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">
                          404
                        </Badge>
                      </td>
                      <td className="p-4 font-medium text-gray-900">Not Found</td>
                      <td className="p-4 text-gray-600">The requested page doesn't exist or has been moved</td>
                      <td className="p-4 text-gray-600">
                        • Check if URL is correct<br/>
                        • Look for redirects on the target site<br/>
                        • Update or remove the link
                      </td>
                    </tr>
                    <tr className="border-b border-orange-100 hover:bg-orange-50">
                      <td className="p-4">
                        <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">
                          403
                        </Badge>
                      </td>
                      <td className="p-4 font-medium text-gray-900">Forbidden</td>
                      <td className="p-4 text-gray-600">Server refuses to serve the content</td>
                      <td className="p-4 text-gray-600">
                        • Contact website owner about access<br/>
                        • Check if authentication is required<br/>
                        • Verify the link is meant to be public
                      </td>
                    </tr>
                    <tr className="border-b border-orange-100 hover:bg-orange-50">
                      <td className="p-4">
                        <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">
                          500
                        </Badge>
                      </td>
                      <td className="p-4 font-medium text-gray-900">Server Error</td>
                      <td className="p-4 text-gray-600">Website server is experiencing problems</td>
                      <td className="p-4 text-gray-600">
                        • Wait and try again later<br/>
                        • Contact the website administrator<br/>
                        • Check if it's a temporary issue
                      </td>
                    </tr>
                    <tr className="border-b border-orange-100 hover:bg-orange-50">
                      <td className="p-4">
                        <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">
                          503
                        </Badge>
                      </td>
                      <td className="p-4 font-medium text-gray-900">Service Unavailable</td>
                      <td className="p-4 text-gray-600">Server is temporarily overloaded or down</td>
                      <td className="p-4 text-gray-600">
                        • Check back later<br/>
                        • Verify if it's maintenance<br/>
                        • Monitor the site status
                      </td>
                    </tr>
                    <tr className="border-b border-orange-100 hover:bg-orange-50">
                      <td className="p-4">
                        <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                          301
                        </Badge>
                      </td>
                      <td className="p-4 font-medium text-gray-900">Moved Permanently</td>
                      <td className="p-4 text-gray-600">Page has been permanently moved to a new location</td>
                      <td className="p-4 text-gray-600">
                        • Update the link to the new URL<br/>
                        • Set up a redirect on your site<br/>
                        • Check the new location manually
                      </td>
                    </tr>
                    <tr className="border-b border-orange-100 hover:bg-orange-50">
                      <td className="p-4">
                        <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                          302
                        </Badge>
                      </td>
                      <td className="p-4 font-medium text-gray-900">Found (Redirect)</td>
                      <td className="p-4 text-gray-600">Page temporarily redirects to another location</td>
                      <td className="p-4 text-gray-600">
                        • Verify the redirect destination<br/>
                        • Update to the final URL if needed<br/>
                        • Monitor for permanent changes
                      </td>
                    </tr>
                    <tr className="border-b border-orange-100 hover:bg-orange-50">
                      <td className="p-4">
                        <Badge variant="outline" className="border-gray-200 text-gray-700 bg-gray-50">
                          0
                        </Badge>
                      </td>
                      <td className="p-4 font-medium text-gray-900">Network Error</td>
                      <td className="p-4 text-gray-600">Cannot connect to the server or domain</td>
                      <td className="p-4 text-gray-600">
                        • Check if domain exists (DNS lookup)<br/>
                        • Verify server is running<br/>
                        • Check your internet connection<br/>
                        • Try accessing from different location
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Best Practices */}
          <div className="mt-16 grid md:grid-cols-2 gap-8">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Prevention Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-green-700">
                  <li>• Regularly audit your website links</li>
                  <li>• Use relative URLs for internal links when possible</li>
                  <li>• Set up monitoring for critical external links</li>
                  <li>• Keep a backup list of important URLs</li>
                  <li>• Test links before publishing content</li>
                  <li>• Use proper redirects when moving pages</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-blue-700">
                  <li>• Click links in results to verify errors</li>
                  <li>• Check if URLs are case-sensitive</li>
                  <li>• Verify trailing slashes in URLs</li>
                  <li>• Test from different browsers/devices</li>
                  <li>• Contact website owners for persistent issues</li>
                  <li>• Update or remove permanently broken links</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-palette-primary to-palette-secondary text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Check Your Links?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Get comprehensive link monitoring with automatic discovery, status validation, and performance analytics.
          </p>
          <div className="flex justify-center">
            <Button size="lg" className="bg-white text-palette-primary hover:bg-palette-accent-3">
              <Link2 className="h-5 w-5 mr-2" />
              Start Link Checking
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
