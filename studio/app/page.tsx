import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Clock, FileText, TrendingUp, Shield, BarChart3, Globe, Sparkles, ArrowRight, CheckCircle, Star, Play, Users, Award, Target, Rocket, Activity, Eye, Monitor } from "lucide-react"
import { UrlInputForm } from "@/components/url-input-form"

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section - Uses Palette Colors */}
      <section className="relative min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, var(--color-accent-1), var(--color-primary), var(--color-secondary))' }}>
        {/* Balanced animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-10 opacity-35">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-pulse" style={{ backgroundColor: 'var(--color-secondary)' }}></div>
            <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse animation-delay-2000" style={{ backgroundColor: 'var(--color-primary)' }}></div>
            <div className="absolute bottom-1/4 left-1/3 w-96 h-96 rounded-full mix-blend-multiply filter blur-2xl opacity-55 animate-pulse animation-delay-4000" style={{ backgroundColor: 'var(--color-accent-1)' }}></div>
          </div>
        </div>
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="mb-8">
            <Badge variant="outline" className="border-white/40 text-white bg-white/15 backdrop-blur-sm px-6 py-2 text-sm font-medium shadow-lg">
              <Rocket className="h-4 w-4 mr-2" />
              The Future of Web Performance
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            The Future of Web Performance
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto mb-8 leading-relaxed">
            Enter your website URL to get comprehensive performance analysis with <span className="text-white font-semibold">lightning-fast analysis</span>, 
            <span className="text-white/90 font-semibold"> AI-powered insights</span>, and 
            <span className="text-white/95 font-semibold"> actionable recommendations</span>.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              Load Time
            </div>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              Page Size
            </div>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              Requests
            </div>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              Core Web Vitals
            </div>
      </div>

          <div className="max-w-3xl mx-auto mb-12">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-8 border border-white/30 shadow-xl">
        <UrlInputForm />
      </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
            <Button size="lg" className="bg-palette-primary hover:bg-palette-primary-hover text-white border-0 px-8 py-4 text-lg font-semibold rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300">
              <Play className="mr-2 h-5 w-5" />
              Analyze Now - It's Free
            </Button>
            <Button size="lg" className="bg-white/20 text-white border border-white/30 hover:bg-white/30 px-8 py-4 text-lg rounded-xl backdrop-blur-sm font-semibold">
              <Eye className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-8 text-white/80">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <span className="font-medium">No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <span className="font-medium">Instant Results</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <span className="font-medium">Enterprise Grade</span>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section - Premium Design */}
      <section className="py-32 px-4 bg-gradient-to-br from-slate-50 to-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,rgba(120,119,198,0.1),transparent)]"></div>
        
        <div className="container mx-auto max-w-7xl relative z-10 px-4">
          <div className="text-center mb-20">
            <Badge variant="outline" className="mb-6 px-4 py-2 border-palette-accent-2 text-palette-primary">
              <Target className="h-4 w-4 mr-2" />
              Professional Grade Tools
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Everything You Need to
              <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-palette-primary to-palette-secondary bg-clip-text text-transparent">Dominate Performance</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              From deep technical analysis to actionable business insights, we've built the most comprehensive 
              performance testing platform for modern websites.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16 justify-items-center">
            {/* Feature 1 - Enhanced */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-primary to-palette-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Activity className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Lightning Analysis</h3>
                  <p className="text-slate-600 mb-4">
                    Get comprehensive Core Web Vitals, performance metrics, and optimization insights in under 30 seconds.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Sub-second analysis time
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Real lighthouse scores
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Mobile & desktop testing
                    </li>
                  </ul>
                </div>
              </CardContent>
        </Card>

            {/* Feature 2 - Enhanced */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-primary to-palette-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">AI-Powered Insights</h3>
                  <p className="text-slate-600 mb-4">
                    Advanced machine learning algorithms provide personalized optimization recommendations that actually work.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Smart priority ranking
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Code-level suggestions
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Impact predictions
                    </li>
                  </ul>
                </div>
              </CardContent>
        </Card>

            {/* Feature 3 - Enhanced */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-primary to-palette-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Monitor className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">Visual Waterfalls</h3>
                  <p className="text-slate-600 mb-4">
                    Interactive waterfall charts reveal exactly where your site slows down with pixel-perfect precision.
                  </p>
                  
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Resource timeline view
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Bottleneck identification
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Download & share reports
                    </li>
                  </ul>
                </div>
              </CardContent>
        </Card>
      </div>

          {/* Additional Premium Features Row */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all duration-300 h-full flex flex-col justify-center">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-primary to-palette-secondary flex items-center justify-center mx-auto mb-4">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
              <h4 className="font-semibold text-slate-800 mb-2">Global Testing</h4>
              <p className="text-sm text-slate-600">Test from 12+ locations worldwide</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all duration-300 h-full flex flex-col justify-center">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-primary to-palette-secondary flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
              <h4 className="font-semibold text-slate-800 mb-2">Security Scan</h4>
              <p className="text-sm text-slate-600">Vulnerability detection included</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all duration-300 h-full flex flex-col justify-center">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-primary to-palette-secondary flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-white" />
                  </div>
              <h4 className="font-semibold text-slate-800 mb-2">Team Sharing</h4>
              <p className="text-sm text-slate-600">Collaborate with your team</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all duration-300 h-full flex flex-col justify-center">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-primary to-palette-secondary flex items-center justify-center mx-auto mb-4">
                    <Award className="h-6 w-6 text-white" />
                  </div>
              <h4 className="font-semibold text-slate-800 mb-2">Expert Support</h4>
              <p className="text-sm text-slate-600">Performance optimization help</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-gradient-to-br from-gray-50 to-palette-accent-3">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">See Your Performance at a Glance</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get instant insights with our comprehensive performance dashboard
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4 justify-items-center">
                <Card className="p-6 bg-white/80 backdrop-blur border-0 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Load Time</p>
                      <p className="text-3xl font-bold text-palette-primary">1.2s</p>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        15% faster
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-palette-primary" />
                  </div>
                </Card>

                <Card className="p-6 bg-white/80 backdrop-blur border-0 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Performance</p>
                      <p className="text-3xl font-bold text-palette-primary">94</p>
                      <div className="flex items-center mt-1">
                        <Star className="h-3 w-3 text-yellow-500 mr-1" />
                        <span className="text-xs text-muted-foreground">Excellent</span>
                      </div>
                </div>
                    <BarChart3 className="h-8 w-8 text-palette-primary" />
              </div>
          </Card>

                <Card className="p-6 bg-white/80 backdrop-blur border-0 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Page Size</p>
                      <p className="text-3xl font-bold text-palette-primary">2.1MB</p>
                      <p className="text-xs text-muted-foreground mt-1">Optimized</p>
                </div>
                    <FileText className="h-8 w-8 text-palette-primary" />
              </div>
          </Card>

                <Card className="p-6 bg-white/80 backdrop-blur border-0 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Requests</p>
                      <p className="text-3xl font-bold text-palette-primary">47</p>
                      <p className="text-xs text-palette-primary mt-1">Good</p>
                    </div>
                    <Globe className="h-8 w-8 text-palette-primary" />
                  </div>
                </Card>
              </div>

              <Card className="p-6 bg-white/80 backdrop-blur border-0 shadow-md">
                <h3 className="font-semibold mb-3 flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-palette-primary" />
                  AI Recommendations
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Optimize images for 30% faster loading
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Enable compression for text resources
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Reduce unused JavaScript by 45KB
                  </li>
                </ul>
              </Card>
            </div>

            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-palette-accent-3 to-palette-accent-2 rounded-2xl shadow-xl p-6">
                <div className="text-center mb-4">
                  <BarChart3 className="h-16 w-16 text-palette-primary mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-700">Interactive Performance Charts</p>
                  <p className="text-sm text-muted-foreground">Detailed waterfall & timing analysis</p>
                </div>
                
                {/* Waterfall Chart Preview */}
                <div className="bg-white/80 backdrop-blur-sm rounded-lg border p-4">
                  <div className="text-xs text-gray-500 mb-2 font-medium">Resource Loading Waterfall</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                      <span className="text-gray-600">JS (124.9 KB) - 1.25s</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-400 h-2 rounded-full" style={{width: '62%'}}></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 bg-green-400 rounded"></div>
                      <span className="text-gray-600">CSS (123.3 KB) - 1.47s</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-400 h-2 rounded-full" style={{width: '73%'}}></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 bg-palette-accent-2 rounded"></div>
                      <span className="text-gray-600">HTML (69.4 KB) - 0.34s</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-palette-accent-2 h-2 rounded-full" style={{width: '17%'}}></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 bg-pink-400 rounded"></div>
                      <span className="text-gray-600">Font (20.9 KB) - 0.26s</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-pink-400 h-2 rounded-full" style={{width: '13%'}}></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Timeline: 0s ——————————————————————— 2s
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-gradient-to-r from-palette-primary to-palette-secondary text-white">
        <div className="container mx-auto max-w-4xl text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Wrangle Your Website's Performance?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of developers and businesses optimizing their websites with PageRodeo's AI-powered analysis.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Start Free Analysis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3 text-white border-white hover:bg-white hover:text-palette-primary">
              View Sample Report
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">50K+</div>
              <div className="text-sm opacity-80">Websites Analyzed</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">99.9%</div>
              <div className="text-sm opacity-80">Uptime Guarantee</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">&lt; 30s</div>
              <div className="text-sm opacity-80">Average Analysis Time</div>
            </div>
        </div>
      </div>
      </section>
    </div>
  )
}