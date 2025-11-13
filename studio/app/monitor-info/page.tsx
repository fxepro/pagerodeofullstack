import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Monitor, 
  Activity, 
  BarChart3, 
  Clock, 
  Target, 
  TrendingUp, 
  Shield, 
  CheckCircle,
  ArrowRight,
  BookOpen,
  Lightbulb,
  Gauge,
  Eye,
  Download,
  Wifi,
  Server,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"

export default function MonitorInfoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-r from-palette-primary to-palette-secondary text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Website Monitoring
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto mb-8 leading-relaxed">
              Comprehensive website monitoring with real-time status checks, 
              technical analysis, and performance metrics tracking.
            </p>
            <div className="flex justify-center">
              <Button size="lg" className="bg-white text-palette-primary hover:bg-palette-accent-3">
                <Monitor className="h-5 w-5 mr-2" />
                Start Monitoring
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
              Monitoring Capabilities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three essential monitoring tools working together to keep your website running smoothly
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Status Monitoring */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Monitor className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Status Monitoring</h3>
                  <p className="text-slate-600 mb-4">
                    Real-time website status checks with instant alerts and uptime tracking.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      HTTP/HTTPS status check
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Response time measurement
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      SSL certificate validation
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Technical Analysis */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Activity className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Technical Analysis</h3>
                  <p className="text-slate-600 mb-4">
                    Deep technical insights into your website's infrastructure and performance.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Server response analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      DNS resolution checks
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Network connectivity tests
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Performance Metrics</h3>
                  <p className="text-slate-600 mb-4">
                    Comprehensive performance tracking with detailed metrics and trends.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Load time tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Uptime statistics
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Historical data analysis
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
              Deep dive into each monitoring tool and understand how they work together
            </p>
          </div>

          <div className="space-y-16">
            {/* Status Monitoring Details */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center">
                  <Monitor className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Status Monitoring</h3>
                  <p className="text-gray-600">Real-time website availability and health checks</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">What is Status Monitoring?</h4>
                  <p className="text-gray-600 mb-4">
                    Status Monitoring provides continuous, real-time checks of your website's availability 
                    and performance. It monitors HTTP/HTTPS responses, measures response times, and validates 
                    SSL certificates to ensure your website is always accessible to users.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Our monitoring system checks your website from multiple global locations, providing 
                    accurate uptime statistics and instant alerts when issues are detected. This helps you 
                    maintain high availability and quickly respond to any downtime.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-palette-accent-1" />
                      Multi-location monitoring
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-palette-accent-1" />
                      Real-time response tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-palette-accent-1" />
                      SSL certificate validation
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-palette-accent-1" />
                      Instant outage alerts
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
                      <strong>Website Uptime Best Practices:</strong> Maintaining 99.9% availability
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Monitoring Response Times:</strong> Understanding and optimizing load speeds
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>SSL Certificate Management:</strong> Keeping your security certificates current
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Analysis Details */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Technical Analysis</h3>
                  <p className="text-gray-600">Deep infrastructure and connectivity insights</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">What is Technical Analysis?</h4>
                  <p className="text-gray-600 mb-4">
                    Technical Analysis provides comprehensive insights into your website's infrastructure, 
                    network connectivity, and server performance. It goes beyond simple uptime checks to 
                    analyze DNS resolution, server response patterns, and network routing.
                  </p>
                  <p className="text-gray-600 mb-4">
                    This analysis helps identify potential bottlenecks, server configuration issues, and 
                    network problems that could affect your website's performance and reliability. It's 
                    essential for maintaining optimal website health and troubleshooting issues.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-palette-accent-1" />
                      Server response analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-palette-accent-1" />
                      DNS resolution checks
                    </li>
                    <li className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-palette-accent-1" />
                      Network connectivity tests
                    </li>
                    <li className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-palette-accent-1" />
                      Infrastructure diagnostics
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
                      <strong>DNS Configuration Guide:</strong> Optimizing domain name resolution
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Server Response Optimization:</strong> Improving backend performance
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Network Troubleshooting:</strong> Diagnosing connectivity issues
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics Details */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Performance Metrics</h3>
                  <p className="text-gray-600">Comprehensive performance tracking and analysis</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">What are Performance Metrics?</h4>
                  <p className="text-gray-600 mb-4">
                    Performance Metrics provide detailed tracking and analysis of your website's performance 
                    over time. This includes load time measurements, uptime statistics, response time trends, 
                    and historical data analysis to help you understand your website's performance patterns.
                  </p>
                  <p className="text-gray-600 mb-4">
                    These metrics help you identify performance trends, plan capacity upgrades, and make 
                    data-driven decisions about your website's infrastructure. They provide the foundation 
                    for continuous performance improvement and optimization.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-palette-accent-1" />
                      Load time tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-palette-accent-1" />
                      Uptime statistics
                    </li>
                    <li className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-palette-accent-1" />
                      Historical data analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-palette-accent-1" />
                      Performance reports
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
                      <strong>Performance Metrics Guide:</strong> Understanding key performance indicators
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Uptime Monitoring Strategies:</strong> Achieving 99.9% availability
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Performance Trend Analysis:</strong> Using historical data for optimization
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
            Ready to Monitor Your Website?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Get comprehensive monitoring with real-time status checks, technical analysis, and performance metrics.
          </p>
          <div className="flex justify-center">
            <Button size="lg" className="bg-white text-palette-primary hover:bg-palette-accent-3">
              <Monitor className="h-5 w-5 mr-2" />
              Start Monitoring
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
