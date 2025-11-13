import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Zap, 
  Brain, 
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
  Activity,
  Eye,
  Download
} from "lucide-react"
import Link from "next/link"

export default function PerformanceInfoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-r from-palette-primary to-palette-secondary text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Performance Analysis
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto mb-8 leading-relaxed">
              Comprehensive website performance testing with lightning-fast analysis, 
              AI-powered insights, and visual waterfall charts.
            </p>
            <div className="flex justify-center">
              <Button size="lg" className="bg-white text-palette-primary hover:bg-palette-accent-3">
                <Zap className="h-5 w-5 mr-2" />
                Start Performance Test
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
              Performance Analysis Capabilities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive performance analysis tools provide deep insights into your website's speed, 
              efficiency, and user experience across all devices and connection types.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-palette-accent-3 to-palette-accent-3">
              <CardHeader className="text-center pb-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Lightning Fast Analysis</CardTitle>
                <CardDescription className="text-gray-600">
                  Get comprehensive performance insights in seconds, not minutes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Sub-3 second analysis time</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Real-time Lighthouse integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Instant visual feedback</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader className="text-center pb-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">AI-Powered Insights</CardTitle>
                <CardDescription className="text-gray-600">
                  Advanced AI analysis provides actionable recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Intelligent performance scoring</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Automated optimization suggestions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Context-aware recommendations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader className="text-center pb-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Visual Waterfalls</CardTitle>
                <CardDescription className="text-gray-600">
                  Interactive charts show exactly how your site loads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Resource loading timeline</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Dependency visualization</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Performance bottleneck identification</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Detailed Capabilities */}
      <section className="py-16 px-4 bg-gradient-to-br from-palette-accent-3 to-palette-accent-3">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Deep Performance Analysis
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive performance testing that goes beyond basic metrics to provide 
              actionable insights for optimization.
            </p>
          </div>

          <div className="space-y-12">
            {/* Core Web Vitals */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Core Web Vitals</h3>
                  <p className="text-gray-600">Google's essential user experience metrics</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">What are Core Web Vitals?</h4>
                  <p className="text-gray-600 mb-4">
                    Core Web Vitals are the three key metrics that Google uses to measure user experience: 
                    Largest Contentful Paint (LCP), First Input Delay (FID), and Cumulative Layout Shift (CLS). 
                    These metrics directly impact your search rankings and user satisfaction.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Our analysis provides detailed measurements of these metrics along with specific 
                    recommendations for improvement, helping you achieve optimal scores and better search visibility.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Benefits</h4>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Improved search rankings</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Better user experience</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Higher conversion rates</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Reduced bounce rates</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Visual Waterfalls */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Visual Waterfalls</h3>
                  <p className="text-gray-600">Interactive performance visualization</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">What are Visual Waterfalls?</h4>
                  <p className="text-gray-600 mb-4">
                    Visual Waterfalls are interactive charts that show exactly how your website loads over time. 
                    Each resource (HTML, CSS, JavaScript, images) is displayed as a horizontal bar, with the 
                    length representing load time and the position showing when it starts loading.
                  </p>
                  <p className="text-gray-600 mb-4">
                    This visualization helps you identify performance bottlenecks, understand resource dependencies, 
                    and see the impact of each element on your overall page load time. It's like having X-ray vision 
                    into your website's performance.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Analysis Features</h4>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Resource timing analysis</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Dependency mapping</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Bottleneck identification</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Optimization opportunities</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* AI-Powered Analysis */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">AI-Powered Analysis</h3>
                  <p className="text-gray-600">Intelligent performance insights and recommendations</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">How AI Enhances Analysis</h4>
                  <p className="text-gray-600 mb-4">
                    Our AI system analyzes your performance data to provide intelligent insights and 
                    personalized recommendations. It understands context, identifies patterns, and 
                    suggests specific optimizations tailored to your website's unique characteristics.
                  </p>
                  <p className="text-gray-600 mb-4">
                    The AI considers factors like your industry, website type, user behavior patterns, 
                    and current performance trends to deliver actionable advice that goes beyond 
                    generic optimization tips.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">AI Capabilities</h4>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Intelligent performance scoring</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Context-aware recommendations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Priority-based optimization</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Predictive performance insights</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-palette-primary to-palette-secondary text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Optimize Your Website Performance?
          </h2>
          <p className="text-xl text-white/90 mb-8 leading-relaxed">
            Start analyzing your website's performance today and get actionable insights 
            to improve speed, user experience, and search rankings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-palette-primary hover:bg-palette-accent-3 px-8 py-3"
              asChild
            >
              <Link href="/performance">
                <Zap className="h-5 w-5 mr-2" />
                Start Performance Test
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-palette-primary px-8 py-3"
              asChild
            >
              <Link href="/consult">
                <BookOpen className="h-5 w-5 mr-2" />
                Get Expert Help
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
