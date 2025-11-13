import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Lock, 
  Globe, 
  Server, 
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
  Download,
  Wifi,
  AlertTriangle,
  Key,
  FileText
} from "lucide-react"
import Link from "next/link"

export default function SSLInfoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-r from-palette-primary to-palette-secondary text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              SSL & Domain Analysis
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto mb-8 leading-relaxed">
              Comprehensive SSL certificate analysis, DNS record inspection, 
              and domain information with detailed security insights.
            </p>
            <div className="flex justify-center">
              <Button size="lg" className="bg-white text-palette-primary hover:bg-palette-accent-3">
                <Lock className="h-5 w-5 mr-2" />
                Start SSL Check
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
              SSL & Domain Capabilities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three essential security and domain tools working together to ensure your website's security and reliability
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* SSL Certificate */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Lock className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">SSL Certificate</h3>
                  <p className="text-slate-600 mb-4">
                    Complete SSL certificate analysis and validation with detailed security insights.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Certificate validity & expiration
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Issuer and chain validation
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Encryption strength analysis
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* DNS Records */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">DNS Records</h3>
                  <p className="text-slate-600 mb-4">
                    Comprehensive DNS record analysis and configuration validation.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      A, AAAA, CNAME records
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      MX and TXT records
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      DNS propagation checks
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Domain Info */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Server className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Domain Info</h3>
                  <p className="text-slate-600 mb-4">
                    Detailed domain registration and configuration information.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Registration details
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Nameserver information
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Domain status checks
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
              Deep dive into each SSL & Domain tool and understand how they work together
            </p>
          </div>

          <div className="space-y-16">
            {/* SSL Certificate Details */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">SSL Certificate</h3>
                  <p className="text-gray-600">Complete SSL certificate analysis and validation</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">What is SSL Certificate Analysis?</h4>
                  <p className="text-gray-600 mb-4">
                    SSL Certificate Analysis provides comprehensive validation and inspection of your website's 
                    SSL/TLS certificates. It checks certificate validity, expiration dates, issuer information, 
                    encryption strength, and certificate chain integrity to ensure your website's security.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Our analysis covers all aspects of SSL implementation, including certificate installation, 
                    configuration, and compliance with security standards. This helps you maintain strong 
                    encryption and protect your users' data.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-palette-accent-1" />
                      Certificate validity & expiration
                    </li>
                    <li className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-palette-accent-1" />
                      Issuer and chain validation
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-palette-accent-1" />
                      Encryption strength analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-palette-accent-1" />
                      Security vulnerability checks
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
                      <strong>SSL Certificate Management:</strong> Best practices for certificate lifecycle
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Encryption Standards Guide:</strong> Understanding TLS/SSL protocols
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Certificate Chain Validation:</strong> Ensuring proper SSL implementation
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* DNS Records Details */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">DNS Records</h3>
                  <p className="text-gray-600">Comprehensive DNS record analysis and validation</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">What is DNS Records Analysis?</h4>
                  <p className="text-gray-600 mb-4">
                    DNS Records Analysis provides detailed inspection of your domain's DNS configuration, 
                    including A, AAAA, CNAME, MX, TXT, and other record types. It validates DNS settings, 
                    checks for misconfigurations, and ensures proper domain resolution.
                  </p>
                  <p className="text-gray-600 mb-4">
                    This analysis helps identify DNS issues that could affect your website's accessibility, 
                    email delivery, and overall performance. It's essential for maintaining proper domain 
                    configuration and troubleshooting connectivity problems.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-palette-accent-1" />
                      A, AAAA, CNAME records
                    </li>
                    <li className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-palette-accent-1" />
                      MX and TXT records
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-palette-accent-1" />
                      DNS propagation checks
                    </li>
                    <li className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-palette-accent-1" />
                      Configuration validation
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
                      <strong>DNS Configuration Guide:</strong> Setting up proper DNS records
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Email DNS Setup:</strong> Configuring MX records for email delivery
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>DNS Troubleshooting:</strong> Common DNS issues and solutions
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Domain Info Details */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center">
                  <Server className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Domain Info</h3>
                  <p className="text-gray-600">Detailed domain registration and configuration information</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">What is Domain Info Analysis?</h4>
                  <p className="text-gray-600 mb-4">
                    Domain Info Analysis provides comprehensive information about your domain's registration, 
                    configuration, and status. It includes registration details, nameserver information, 
                    domain status checks, and ownership verification to ensure proper domain management.
                  </p>
                  <p className="text-gray-600 mb-4">
                    This analysis helps you understand your domain's current state, identify potential issues, 
                    and ensure compliance with domain management best practices. It's essential for maintaining 
                    domain security and preventing unauthorized changes.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-palette-accent-1" />
                      Registration details
                    </li>
                    <li className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-palette-accent-1" />
                      Nameserver information
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-palette-accent-1" />
                      Domain status checks
                    </li>
                    <li className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-palette-accent-1" />
                      Ownership verification
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
                      <strong>Domain Management Best Practices:</strong> Securing and maintaining your domain
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Nameserver Configuration:</strong> Setting up proper DNS servers
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Domain Security Guide:</strong> Protecting against domain hijacking
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
            Ready to Check Your SSL & Domain?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Get comprehensive SSL certificate analysis, DNS record inspection, and domain information.
          </p>
          <div className="flex justify-center">
            <Button size="lg" className="bg-white text-palette-primary hover:bg-palette-accent-3">
              <Lock className="h-5 w-5 mr-2" />
              Start SSL Check
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
