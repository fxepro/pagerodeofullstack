import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Brain, 
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
  Zap,
  Server,
  AlertTriangle,
  Cpu,
  Database,
  Settings
} from "lucide-react"
import Link from "next/link"

export default function AIInfoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-r from-palette-primary to-palette-secondary text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              AI Health Monitoring
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto mb-8 leading-relaxed">
              Comprehensive AI system health monitoring with real-time performance tracking, 
              model analysis, and intelligent insights for optimal AI operations.
            </p>
            <div className="flex justify-center">
              <Button size="lg" className="bg-white text-palette-primary hover:bg-palette-accent-3">
                <Brain className="h-5 w-5 mr-2" />
                Check AI Health
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
              AI Health Capabilities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three essential AI monitoring tools working together to keep your AI systems running optimally
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* AI API Health */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Activity className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">AI API Health</h3>
                  <p className="text-slate-600 mb-4">
                    Real-time monitoring of AI API endpoints with response time tracking and error rate analysis.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Response time monitoring
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Uptime tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Error rate analysis
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Model Performance */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Model Performance</h3>
                  <p className="text-slate-600 mb-4">
                    Deep analysis of AI model performance including latency, accuracy, and drift detection.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Model latency tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Accuracy monitoring
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Drift detection
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Cost & Usage Tracking */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Cost & Usage Tracking</h3>
                  <p className="text-slate-600 mb-4">
                    Comprehensive tracking of AI token usage, costs, and resource consumption patterns.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Token usage tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Cost analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Usage optimization
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
              Deep dive into each AI health monitoring tool and understand how they work together
            </p>
          </div>

          <div className="space-y-16">
            {/* AI API Health Details */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">AI API Health</h3>
                  <p className="text-gray-600">Real-time monitoring of AI API endpoints and performance</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">What is AI API Health?</h4>
                  <p className="text-gray-600 mb-4">
                    AI API Health monitoring provides continuous, real-time checks of your AI service endpoints, 
                    measuring response times, tracking uptime, and analyzing error rates. This ensures your AI 
                    systems are always available and performing optimally for your users.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Our monitoring system checks AI endpoints from multiple locations, providing accurate 
                    performance statistics and instant alerts when issues are detected. This helps you maintain 
                    high AI service availability and quickly respond to any performance degradation.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-palette-accent-1" />
                      Response time monitoring
                    </li>
                    <li className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-palette-accent-1" />
                      Uptime tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-palette-accent-1" />
                      Error rate analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-palette-accent-1" />
                      Instant performance alerts
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
                      <strong>AI API Monitoring Best Practices:</strong> Maintaining optimal AI service performance
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Response Time Optimization:</strong> Reducing AI inference latency
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Error Handling Strategies:</strong> Managing AI service failures gracefully
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Model Performance Details */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Model Performance</h3>
                  <p className="text-gray-600">Deep analysis of AI model performance and accuracy</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">What is Model Performance?</h4>
                  <p className="text-gray-600 mb-4">
                    Model Performance monitoring provides comprehensive analysis of your AI models' behavior, 
                    including inference latency, accuracy metrics, and drift detection. This helps ensure your 
                    models are performing as expected and maintaining high-quality outputs over time.
                  </p>
                  <p className="text-gray-600 mb-4">
                    This analysis helps identify performance degradation, accuracy issues, and model drift that 
                    could affect your AI system's reliability. It's essential for maintaining optimal AI model 
                    performance and ensuring consistent, high-quality results.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-palette-accent-1" />
                      Model latency tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-palette-accent-1" />
                      Accuracy monitoring
                    </li>
                    <li className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-palette-accent-1" />
                      Drift detection
                    </li>
                    <li className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-palette-accent-1" />
                      Model optimization insights
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
                      <strong>Model Performance Optimization:</strong> Improving AI inference speed and accuracy
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Model Drift Detection:</strong> Identifying and addressing performance degradation
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Accuracy Monitoring Strategies:</strong> Maintaining model quality over time
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost & Usage Tracking Details */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Cost & Usage Tracking</h3>
                  <p className="text-gray-600">Comprehensive tracking of AI resource consumption and costs</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">What is Cost & Usage Tracking?</h4>
                  <p className="text-gray-600 mb-4">
                    Cost & Usage Tracking provides detailed monitoring of your AI resource consumption, including 
                    token usage, API costs, and compute expenses. This helps you understand your AI spending patterns 
                    and optimize resource allocation for better cost efficiency.
                  </p>
                  <p className="text-gray-600 mb-4">
                    These insights help you identify cost optimization opportunities, plan AI budgets, and make 
                    data-driven decisions about AI resource usage. They provide the foundation for cost-effective 
                    AI operations and resource planning.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-palette-accent-1" />
                      Token usage tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-palette-accent-1" />
                      Cost analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-palette-accent-1" />
                      Usage optimization
                    </li>
                    <li className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-palette-accent-1" />
                      Cost reports
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
                      <strong>AI Cost Optimization Guide:</strong> Reducing AI operational expenses
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>Token Usage Strategies:</strong> Optimizing AI model input/output efficiency
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-palette-primary" />
                    <span className="text-gray-700">
                      <strong>AI Budget Planning:</strong> Managing AI costs and resource allocation
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
            Ready to Monitor Your AI Health?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Get comprehensive AI health monitoring with real-time performance tracking, model analysis, and cost optimization.
          </p>
          <div className="flex justify-center">
            <Button size="lg" className="bg-white text-palette-primary hover:bg-palette-accent-3">
              <Brain className="h-5 w-5 mr-2" />
              Check AI Health
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
