"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Bell, 
  Calendar, 
  Clock, 
  Eye, 
  Globe, 
  Mail, 
  Monitor, 
  Rocket, 
  Settings, 
  TrendingUp, 
  Users, 
  Zap 
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MonitoringData {
  uptime: number
  responseTime: number
  errorRate: number
  activeUsers: number
  pageViews: number
  performanceScore: number
  alerts: number
  lastCheck: string
}

export function MonitorContent() {
  const [email, setEmail] = useState("")
  const [isSubscribing, setIsSubscribing] = useState(false)
  const { toast } = useToast()

  // Dummy monitoring data
  const monitoringData: MonitoringData = {
    uptime: 99.97,
    responseTime: 245,
    errorRate: 0.03,
    activeUsers: 1247,
    pageViews: 8942,
    performanceScore: 94,
    alerts: 2,
    lastCheck: "2 minutes ago"
  }

  const handleSubscribe = async () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to subscribe.",
        variant: "destructive",
      })
      return
    }

    setIsSubscribing(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    toast({
      title: "Successfully Subscribed!",
      description: "You'll be notified when monitoring features are released.",
    })
    
    setEmail("")
    setIsSubscribing(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Monitor className="h-12 w-12 text-palette-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-palette-primary to-palette-secondary bg-clip-text text-transparent">Website Monitoring</h1>
          </div>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Comprehensive website monitoring and performance tracking. Get real-time insights, 
            automated alerts, and detailed analytics to ensure your website stays fast and reliable.
          </p>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-gradient-to-r from-palette-accent-1/10 via-purple-400/5 to-palette-primary/10 border-2 border-palette-accent-1/20 rounded-2xl p-8 mb-16 text-center shadow-lg">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Rocket className="h-8 w-8 text-palette-primary" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-palette-primary to-palette-secondary bg-clip-text text-transparent">🚀 COMING SOON</h2>
          </div>
          <p className="text-lg text-slate-600 mb-6 max-w-2xl mx-auto">
            We're building the most comprehensive website monitoring platform. 
            Sign up below to be the first to know when we launch and get early access.
          </p>
        
        {/* Email Signup */}
        <div className="max-w-md mx-auto space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Get notified when we launch
            </Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleSubscribe} 
                disabled={isSubscribing}
                className="px-6 bg-gradient-to-r from-palette-accent-1 to-palette-primary hover:from-palette-primary hover:to-palette-primary-hover text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
              >
                {isSubscribing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Subscribe
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            We'll only use your email to notify you about the launch. No spam, ever.
          </p>
        </div>
        </div>

        {/* Current Monitoring Status */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800">
            <Activity className="h-6 w-6 text-palette-primary" />
            Current Monitoring Status
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-palette-primary">{monitoringData.uptime}%</div>
                <Progress value={monitoringData.uptime} className="mt-2" />
                <p className="text-xs text-slate-500 mt-1">Last 30 days</p>
              </CardContent>
            </Card>

            <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-palette-primary">{monitoringData.responseTime}ms</div>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-600">-12% from last week</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-palette-primary">{monitoringData.errorRate}%</div>
                <div className="flex items-center gap-2 mt-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-xs text-yellow-600">2 errors today</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Performance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-palette-primary">{monitoringData.performanceScore}/100</div>
                <Progress value={monitoringData.performanceScore} className="mt-2" />
                <p className="text-xs text-slate-500 mt-1">Core Web Vitals</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Upcoming Monitoring Capabilities */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800">
            <BarChart3 className="h-6 w-6 text-palette-primary" />
            Upcoming Monitoring Capabilities
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Real-time Monitoring */}
            <Card className="border-2 border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-palette-accent-3 rounded-lg">
                    <Eye className="h-5 w-5 text-palette-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-palette-accent-3 text-palette-primary">Coming Soon</Badge>
                </div>
                <CardTitle className="text-slate-800">Real-time Monitoring</CardTitle>
                <CardDescription className="text-slate-600">
                  Monitor your website 24/7 with instant alerts and notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="h-4 w-4 text-palette-accent-1" />
                    <span>Uptime monitoring every 30 seconds</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Bell className="h-4 w-4 text-palette-accent-1" />
                    <span>Instant SMS, email, and Slack alerts</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Globe className="h-4 w-4 text-palette-accent-1" />
                    <span>Global monitoring from 20+ locations</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Analytics */}
            <Card className="border-2 border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-palette-accent-3 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-palette-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-palette-accent-3 text-palette-primary">Coming Soon</Badge>
                </div>
                <CardTitle className="text-slate-800">Performance Analytics</CardTitle>
                <CardDescription className="text-slate-600">
                  Deep insights into Core Web Vitals and performance trends
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Zap className="h-4 w-4 text-palette-accent-1" />
                    <span>LCP, FID, and CLS tracking</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <BarChart3 className="h-4 w-4 text-palette-accent-1" />
                    <span>Historical performance data</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Activity className="h-4 w-4 text-palette-accent-1" />
                    <span>Performance regression detection</span>
                  </div>
                </div>
              </CardContent>
                      </Card>

            {/* User Experience Monitoring */}
            <Card className="border-2 border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-palette-accent-3 rounded-lg">
                    <Users className="h-5 w-5 text-palette-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-palette-accent-3 text-palette-primary">Coming Soon</Badge>
                </div>
                <CardTitle className="text-slate-800">User Experience Monitoring</CardTitle>
                <CardDescription className="text-slate-600">
                  Track real user interactions and experience metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Eye className="h-4 w-4 text-palette-accent-1" />
                    <span>Session recordings and heatmaps</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Activity className="h-4 w-4 text-palette-accent-1" />
                    <span>User journey analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <AlertTriangle className="h-4 w-4 text-palette-accent-1" />
                    <span>Error tracking and debugging</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Automated Testing */}
            <Card className="border-2 border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-palette-accent-3 rounded-lg">
                    <Settings className="h-5 w-5 text-palette-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-palette-accent-3 text-palette-primary">Coming Soon</Badge>
                </div>
                <CardTitle className="text-slate-800">Automated Testing</CardTitle>
                <CardDescription className="text-slate-600">
                  Continuous testing and validation of your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="h-4 w-4 text-palette-accent-1" />
                    <span>Scheduled performance tests</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Globe className="h-4 w-4 text-palette-accent-1" />
                    <span>Cross-browser compatibility</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Zap className="h-4 w-4 text-palette-accent-1" />
                    <span>Mobile responsiveness testing</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alert Management */}
            <Card className="border-2 border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-palette-accent-3 rounded-lg">
                    <Bell className="h-5 w-5 text-palette-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-palette-accent-3 text-palette-primary">Coming Soon</Badge>
                </div>
                <CardTitle className="text-slate-800">Smart Alert Management</CardTitle>
                <CardDescription className="text-slate-600">
                  Intelligent alerts with escalation and team management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <AlertTriangle className="h-4 w-4 text-palette-accent-1" />
                    <span>Threshold-based alerting</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users className="h-4 w-4 text-palette-accent-1" />
                    <span>Team escalation rules</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4 text-palette-accent-1" />
                    <span>Maintenance window scheduling</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Monitoring */}
            <Card className="border-2 border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-palette-accent-3 rounded-lg">
                    <Globe className="h-5 w-5 text-palette-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-palette-accent-3 text-palette-primary">Coming Soon</Badge>
                </div>
                <CardTitle className="text-slate-800">API & Backend Monitoring</CardTitle>
                <CardDescription className="text-slate-600">
                  Monitor your APIs, databases, and backend services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Activity className="h-4 w-4 text-palette-accent-1" />
                    <span>API endpoint monitoring</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <BarChart3 className="h-4 w-4 text-palette-accent-1" />
                    <span>Database performance tracking</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Zap className="h-4 w-4 text-palette-accent-1" />
                    <span>Response time monitoring</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      

        {/* Final CTA */}
        <div className="text-center bg-gradient-to-r from-palette-accent-1/5 via-purple-400/10 to-palette-primary/5 border border-palette-accent-2/30 rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-slate-800">Ready to Get Started?</h2>
          <p className="text-lg text-slate-600 mb-6 max-w-2xl mx-auto">
            Be among the first to experience professional website monitoring. 
            Sign up for early access and exclusive launch offers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={handleSubscribe} disabled={isSubscribing} className="bg-gradient-to-r from-palette-accent-1 to-palette-primary hover:from-palette-primary hover:to-palette-primary-hover text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-300">
              <Mail className="h-5 w-5 mr-2" />
              {isSubscribing ? "Subscribing..." : "Get Early Access"}
            </Button>
            <Button variant="outline" size="lg" className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3">
              <Rocket className="h-5 w-5 mr-2" />
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
