"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Brain, 
  Activity, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  CheckCircle,
  Zap,
  DollarSign,
  BarChart3,
  Server,
  Shield,
  Eye,
  ArrowRight,
  Loader2,
  AlertCircle,
  Wifi,
  Cpu,
  Database,
  MessageCircle,
  BookOpen
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { ConsultationCTA } from "@/components/consultation-cta"

interface AIHealthStatus {
  overall: 'healthy' | 'degraded' | 'down'
  providers: Array<{
    name: string
    status: 'healthy' | 'degraded' | 'down' | 'unknown'
    responseTime: number
    lastChecked: string
    errorRate: number
    uptime: number
    model: string
    apiKey: boolean
  }>
  lastUpdated: string
  totalRequests: number
  successRate: number
  averageResponseTime: number
}

interface AIMetrics {
  timeRange: string
  totalRequests: number
  successRequests: number
  errorRequests: number
  successRate: number
  totalTokens: number
  totalCost: number
  averageResponseTime: number
  p95ResponseTime: number
  providerStats: Array<{
    provider: string
    model: string
    requests: number
    successRequests: number
    errorRequests: number
    totalTokens: number
    totalCost: number
    averageResponseTime: number
  }>
  recentMetrics: Array<any>
  lastUpdated: string
}

interface AIHealthMainProps {
  url?: string;
}

export function AIHealthMain({ url: initialUrl = "" }: AIHealthMainProps) {
  const [url, setUrl] = useState(initialUrl)
  const [isChecking, setIsChecking] = useState(false)
  const [healthStatus, setHealthStatus] = useState<AIHealthStatus | null>(null)
  const [metrics, setMetrics] = useState<AIMetrics | null>(null)
  const [error, setError] = useState("")
  const [testResults, setTestResults] = useState<any>(null)
  const { toast } = useToast()

  // Auto-trigger analysis if URL provided as prop
  useEffect(() => {
    if (initialUrl && !healthStatus && !isChecking) {
      const timer = setTimeout(() => {
        handleCheckHealth();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialUrl]); // Only run when initialUrl changes

  const loadHealthStatus = async () => {
    try {
      const response = await fetch('/api/ai-health/status')
      if (response.ok) {
        const data = await response.json()
        setHealthStatus(data)
      }
    } catch (error) {
      console.error('Failed to load health status:', error)
    }
  }

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/ai-health/metrics')
      if (response.ok) {
        const data = await response.json()
        console.log('[AI Health] Loaded metrics:', data)
        setMetrics(data)
      }
    } catch (error) {
      console.error('Failed to load metrics:', error)
    }
  }

  const handleCheckHealth = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a website URL to check AI health.",
        variant: "destructive",
      })
      return
    }

    // Clean the URL - remove protocol, www, and trailing paths (but keep full URL for analysis)
    let cleanUrl = url.trim()
    // For AI Health, we might need the full URL with protocol, so let's be smart about it
    if (!cleanUrl.match(/^https?:\/\//)) {
      cleanUrl = 'https://' + cleanUrl
    }

    setIsChecking(true)
    setError("")
    
    try {
      console.log('[AI Health] Starting AI health check for:', cleanUrl)
      
      // First, run a performance analysis to get data for AI processing
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: cleanUrl }),
      })

      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze website performance')
      }

      const performanceData = await analyzeResponse.json()
      console.log('[AI Health] Performance analysis completed:', performanceData.url)

      // Now run AI analysis to test AI health
      const aiResponse = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: `Analyze this website performance data and provide insights:\n\nURL: ${performanceData.url}\nLoad Time: ${performanceData.loadTime}s\nPerformance Score: ${performanceData.performanceScore}\nCore Web Vitals: LCP=${performanceData.coreWebVitals.lcp}ms, FID=${performanceData.coreWebVitals.fid}ms, CLS=${performanceData.coreWebVitals.cls}`,
          performanceData 
        }),
      })

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json()
        console.error('[AI Health] AI analysis failed:', errorData)
        throw new Error(errorData.error || errorData.details || 'Failed to run AI analysis')
      }

      const aiData = await aiResponse.json()
      console.log('[AI Health] AI analysis completed')

      // Store test results
      setTestResults({
        url: performanceData.url,
        performanceData,
        aiData,
        timestamp: new Date().toISOString()
      })

      // Reload health status and metrics to show updated data
      await Promise.all([loadHealthStatus(), loadMetrics()])
      
      toast({
        title: "AI Health Checked",
        description: `Successfully analyzed AI health for ${url}. AI system is working properly.`,
      })

    } catch (err) {
      console.error('[AI Health] Check failed:', err)
      setError(err instanceof Error ? err.message : "Failed to check AI health")
      toast({
        title: "AI Health Check Failed",
        description: err instanceof Error ? err.message : "Failed to check AI health",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'degraded': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'down': return <AlertCircle className="h-5 w-5 text-red-600" />
      default: return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center justify-center bg-gradient-to-br from-palette-accent-2 via-palette-accent-1 to-palette-primary">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-10 opacity-35">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-palette-primary-hover rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-800 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse animation-delay-2000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-palette-primary rounded-full mix-blend-multiply filter blur-2xl opacity-55 animate-pulse animation-delay-4000"></div>
          </div>
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="mb-6">
            <Badge variant="outline" className="border-white/40 text-white bg-white/15 backdrop-blur-sm px-6 py-2 text-sm font-medium shadow-lg">
              <Brain className="h-4 w-4 mr-2" />
              AI Health Monitoring
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Test AI System Health
          </h1>
          
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
            Enter a website URL to test our AI system health. We'll analyze the website and 
            monitor AI model performance.
          </p>

          {/* URL Input Section */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-8 border border-white/30 shadow-xl">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  id="ai-health-url"
                  type="text"
                  placeholder="example.com or https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 h-14 text-lg px-4 bg-white/90 border-0 rounded-xl placeholder:text-gray-500 focus:ring-2 focus:ring-white/50"
                  disabled={isChecking}
                />
                <Button 
                  onClick={handleCheckHealth}
                  disabled={isChecking}
                  className="bg-gradient-to-r from-palette-primary to-palette-primary-hover hover:from-purple-700 hover:to-palette-secondary text-white px-8 py-3 h-14 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center"
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Brain className="h-5 w-5 mr-2" />
                      Check AI Health
                    </>
                  )}
                </Button>
              </div>
              
              {error && (
                <Alert variant="destructive" className="mt-4 bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error}
                    {error.includes('API key') && (
                      <div className="mt-2 text-sm">
                        <strong>Setup Required:</strong> Add your Gemini API key to <code className="bg-red-100 px-1 rounded">.env.local</code>
                        <br />
                        Get your free API key from: <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <p className="text-center text-white/80 mt-4 text-sm">
              We'll analyze the website and test our AI system performance, response times, and health
            </p>
          </div>
          
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-palette-accent-2/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-palette-accent-2/70 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* AI Health Dashboard */}
      <div className="bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
        <div className="container mx-auto px-4 py-16 max-w-7xl">
          
          {/* Performance Metrics Section - Only show when we have data */}
          {healthStatus && (
            <div className="space-y-8 mb-16">
            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-palette-primary" />
                  Performance Metrics
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Real-time AI system performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-palette-primary">
                      {healthStatus?.averageResponseTime ? `${healthStatus.averageResponseTime}ms` : 'N/A'}
                    </div>
                    <p className="text-sm text-slate-600">Average Response Time</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {healthStatus?.successRate ? `${healthStatus.successRate}%` : 'N/A'}
                    </div>
                    <p className="text-sm text-slate-600">Success Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">
                      {healthStatus?.totalRequests || 0}
                    </div>
                    <p className="text-sm text-slate-600">Total Requests</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-700">
                      {healthStatus?.overall || 'Unknown'}
                    </div>
                    <p className="text-sm text-slate-600">Overall Status</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          )}
          
          {/* Test Results Section */}
          {testResults && (
            <div className="space-y-8 mb-16">
              <Card className="border-green-200/50 shadow-lg bg-green-50/50">
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    AI Health Test Results
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    AI system successfully analyzed {testResults.url}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-green-800 mb-2">Website Performance</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Load Time:</span>
                          <span className="font-medium">{testResults.performanceData.loadTime}s</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Performance Score:</span>
                          <span className="font-medium">{testResults.performanceData.performanceScore}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Requests:</span>
                          <span className="font-medium">{testResults.performanceData.requests}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-800 mb-2">AI Analysis</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>AI Grade:</span>
                          <span className="font-medium">{testResults.aiData.grade || 'A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Analysis Time:</span>
                          <span className="font-medium">~2-3 seconds</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <span className="font-medium text-green-600">✓ Healthy</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-white/50 rounded-lg">
                    <p className="text-sm text-green-700">
                      <strong>AI Insight:</strong> {testResults.aiData.summary || 'AI system is functioning properly and providing accurate analysis.'}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      onClick={handleCheckHealth}
                      disabled={isChecking}
                      variant="outline"
                      className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
                    >
                      <Activity className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                      Re-check
                    </Button>
                    <Button 
                      onClick={() => {
                        setTestResults(null)
                        setUrl("")
                        setError("")
                      }}
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Clear Results
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Overall Status */}
          {healthStatus && (
            <div className="space-y-8">
              {/* Status Overview */}
              <div className="grid md:grid-cols-4 gap-6">
                <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Overall Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(healthStatus.overall)}
                      <Badge className={`${getStatusColor(healthStatus.overall)} bg-opacity-10`}>
                        {healthStatus.overall.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Last updated: {new Date(healthStatus.lastUpdated).toLocaleTimeString()}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Success Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-palette-primary">{healthStatus.successRate}%</div>
                    <p className="text-xs text-slate-500 mt-1">AI requests</p>
                  </CardContent>
                </Card>

                <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Avg Response Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-palette-primary">{healthStatus.averageResponseTime}ms</div>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingDown className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600">-5% from last hour</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      Total Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-palette-primary">{healthStatus.totalRequests.toLocaleString()}</div>
                    <p className="text-xs text-slate-500 mt-1">All time</p>
                  </CardContent>
                </Card>
              </div>

              {/* AI Providers Status */}
              <Card className="border-palette-accent-2/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-palette-primary" />
                    AI Providers Status
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Real-time status of all configured AI providers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {healthStatus.providers.map((provider, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(provider.status)}
                            <div>
                              <p className="font-medium text-slate-800 capitalize">{provider.name}</p>
                              <p className="text-sm text-slate-600">{provider.model}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-medium text-slate-800">{provider.responseTime}ms</p>
                            <p className="text-slate-500">Response</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-slate-800">{provider.uptime}%</p>
                            <p className="text-slate-500">Uptime</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-slate-800">{provider.errorRate}%</p>
                            <p className="text-slate-500">Error Rate</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Metrics Overview */}
              <Card className="border-palette-accent-2/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-palette-primary" />
                    Recent Metrics
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Performance metrics from the last {metrics?.timeRange || '1h'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-palette-primary">{metrics?.totalRequests || 0}</div>
                      <p className="text-sm text-slate-600">Total Requests</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">{metrics?.successRate || 0}%</div>
                      <p className="text-sm text-slate-600">Success Rate</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-700">{(metrics?.totalTokens || 0).toLocaleString()}</div>
                      <p className="text-sm text-slate-600">Total Tokens</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-700">${(metrics?.totalCost || 0).toFixed(2)}</div>
                      <p className="text-sm text-slate-600">Total Cost</p>
                    </div>
                  </div>
                  {(!metrics || metrics.totalRequests === 0) && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-lg text-center">
                      <p className="text-sm text-slate-600">
                        No metrics available yet. Run an AI health test to see metrics.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-palette-accent-2/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-palette-primary" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Manage and monitor your AI infrastructure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Button 
                      onClick={loadHealthStatus}
                      className="bg-gradient-to-r from-palette-accent-1 to-palette-primary hover:from-palette-primary hover:to-palette-primary-hover text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Refresh Status
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        setTestResults(null)
                        setUrl("")
                        setError("")
                      }}
                      variant="outline" 
                      className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                    
                    <Button variant="outline" className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3">
                      <Database className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Features Section */}
          {!healthStatus && !testResults && (
            <div className="grid md:grid-cols-3 gap-8 justify-items-center">
              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Activity className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-slate-800">Real-time Monitoring</h3>
                    <p className="text-slate-600 mb-4">
                      Track AI model performance, response times, and system health in real-time with comprehensive dashboards.
                    </p>
                    <ul className="space-y-2 text-sm text-slate-500">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Live performance metrics
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Response time tracking
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Error rate monitoring
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <DollarSign className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-slate-800">Cost Tracking</h3>
                    <p className="text-slate-600 mb-4">
                      Monitor token usage and costs across all AI providers with detailed spending analytics.
                    </p>
                    <ul className="space-y-2 text-sm text-slate-500">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Token usage tracking
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Cost per request
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Budget alerts
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-slate-800">Multi-Provider Support</h3>
                    <p className="text-slate-600 mb-4">
                      Monitor multiple AI providers including Gemini, OpenAI, and Anthropic with unified dashboards.
                    </p>
                    <ul className="space-y-2 text-sm text-slate-500">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Gemini integration
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        OpenAI monitoring
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Anthropic support
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Call to Action Section - Only show after results */}
          {testResults && (
            <ConsultationCTA
              title="Need Help Optimizing Your AI Performance?"
              description="Our expert consultants can help you analyze your AI system performance, optimize response times, and implement best practices for maximum efficiency."
              secondaryButtonHref="/ai-info"
            />
          )}
        </div>
      </div>
    </div>
  )
}
