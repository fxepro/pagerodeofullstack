import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Code, 
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
  Eye
} from "lucide-react"
import Link from "next/link"

export function ApiInfoMain() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-r from-palette-primary to-palette-secondary text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              API Health Checker
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto mb-8 leading-relaxed">
              Automatically discover, test, and analyze API endpoints with comprehensive health monitoring 
              and performance analytics.
            </p>
            <div className="flex justify-center">
              <Button size="lg" className="bg-white text-palette-primary hover:bg-palette-accent-3">
                <Code className="h-5 w-5 mr-2" />
                Start API Testing
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
              API Testing Capabilities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three essential API testing tools working together to ensure your endpoints are healthy and performant
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Auto Discovery */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Auto Discovery</h3>
                  <p className="text-slate-600 mb-4">
                    Automatically discover API endpoints through intelligent sitemap analysis and web crawling.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Sitemap.xml parsing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      HTML link extraction
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Pattern matching
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Real-Time Testing */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Real-Time Testing</h3>
                  <p className="text-slate-600 mb-4">
                    Comprehensive endpoint testing with live HTTP requests and detailed response analysis.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Status code validation
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Response time measurement
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      JSON body analysis
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
                    Detailed performance metrics and analytics to optimize your API endpoints.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Latency tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Success rate analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Error reporting
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
              Deep dive into each API testing capability and understand how they work together
            </p>
          </div>

          <div className="space-y-16">
            {/* Auto Discovery Details */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Auto Discovery</h3>
                  <p className="text-gray-600">Intelligent API endpoint discovery and detection</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">What is Auto Discovery?</h4>
                  <p className="text-gray-600 mb-4">
                    Auto Discovery uses multiple intelligent methods to find API endpoints on your domain. 
                    It starts by checking your sitemap.xml for any URLs containing "/api/" paths, then falls back 
                    to crawling your website for API links in HTML content.
                  </p>
                  <p className="text-gray-600 mb-4">
                    If no endpoints are found through these methods, our system tests common API patterns 
                    like /api, /posts, /users, and other standard REST endpoints to discover hidden APIs 
                    that might not be publicly linked.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-palette-accent-1" />
                      Sitemap.xml parsing
                    </li>
                    <li className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-palette-accent-1" />
                      HTML link extraction
                    </li>
                    <li className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-palette-accent-1" />
                      Pattern matching
                    </li>
                    <li className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-palette-accent-1" />
                      Endpoint validation
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
                      <strong>API Discovery Best Practices:</strong> Organizing your API endpoints for better discoverability
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Sitemap Optimization:</strong> Including API endpoints in your sitemap.xml
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>REST API Design Patterns:</strong> Creating discoverable and consistent API structures
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-Time Testing Details */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Real-Time Testing</h3>
                  <p className="text-gray-600">Live API endpoint testing and response analysis</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">What is Real-Time Testing?</h4>
                  <p className="text-gray-600 mb-4">
                    Real-Time Testing performs live HTTP requests to each discovered API endpoint, measuring 
                    response times, validating status codes, and analyzing response bodies. This provides 
                    immediate feedback on API health and performance.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Our testing system handles various HTTP methods, timeout scenarios, and authentication 
                    requirements. It provides detailed error reporting and success rate analysis to help 
                    you understand your API's reliability and performance characteristics.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-palette-accent-1" />
                      HTTP status validation
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-palette-accent-1" />
                      Response time measurement
                    </li>
                    <li className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-palette-accent-1" />
                      JSON body analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-palette-accent-1" />
                      Authentication detection
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
                      <strong>API Testing Strategies:</strong> Comprehensive testing approaches for REST APIs
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Response Time Optimization:</strong> Reducing API latency for better user experience
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Error Handling Best Practices:</strong> Implementing robust error responses
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
                  <p className="text-gray-600">Comprehensive performance metrics and reporting</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">What are Performance Analytics?</h4>
                  <p className="text-gray-600 mb-4">
                    Performance Analytics provides detailed insights into your API endpoints' performance 
                    characteristics. This includes latency measurements, success rates, error analysis, 
                    and comprehensive reporting to help you optimize your API infrastructure.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Our analytics system tracks performance trends over time, identifies bottlenecks, 
                    and provides actionable insights for improving API reliability and speed. This data 
                    helps you make informed decisions about capacity planning and performance optimization.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-palette-accent-1" />
                      Latency tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-palette-accent-1" />
                      Success rate analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-palette-accent-1" />
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
                      <strong>API Performance Metrics:</strong> Understanding key performance indicators for APIs
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Latency Optimization:</strong> Reducing API response times for better performance
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Performance Monitoring Strategies:</strong> Implementing effective API monitoring
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
            Ready to Test Your APIs?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Get comprehensive API testing with automatic discovery, real-time monitoring, and performance analytics.
          </p>
          <div className="flex justify-center">
            <Button size="lg" className="bg-white text-palette-primary hover:bg-palette-accent-3">
              <Code className="h-5 w-5 mr-2" />
              Start API Testing
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
