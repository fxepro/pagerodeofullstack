"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Code, 
  Mountain, 
  Target, 
  Heart, 
  Lightbulb, 
  Users, 
  ArrowRight,
  CheckCircle,
  MessageSquare,
  DollarSign,
  Zap,
  Globe,
  BarChart3,
  Shield,
  Brain
} from "lucide-react"
import Link from "next/link"

export function AboutMain() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-palette-accent-2 via-palette-accent-1 to-palette-primary">
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
          <div className="mb-8">
            <Badge variant="outline" className="border-white/40 text-white bg-white/15 backdrop-blur-sm px-6 py-2 text-sm font-medium shadow-lg">
              <Code className="h-4 w-4 mr-2" />
              Built with Passion
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            About PageRodeo
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto mb-8 leading-relaxed">
            Created and coded by a <span className="text-white font-semibold">solopreneur from Colorado</span>, 
            easing the pain of finding and chasing performance metrics.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              <Mountain className="h-4 w-4 inline mr-2" />
              Colorado Built
            </div>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              <Heart className="h-4 w-4 inline mr-2" />
              Passion Project
            </div>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              <Target className="h-4 w-4 inline mr-2" />
              Problem Solver
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
        <div className="container mx-auto px-4 py-16 max-w-7xl">
          
          {/* The Story Section */}
          <div className="mb-16">
            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2 text-3xl">
                  <Lightbulb className="h-8 w-8 text-palette-primary" />
                  The Story Behind PageRodeo
                </CardTitle>
                <CardDescription className="text-slate-600 text-lg">
                  A personal journey that became a solution for everyone
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose prose-lg max-w-none text-slate-700">
                  <p className="text-xl leading-relaxed mb-6">
                    <strong>This is the tool that I built for myself and then made available to everyone.</strong>
                  </p>
                  
                  <p className="text-lg leading-relaxed mb-6">
                    As a solopreneur working from the beautiful mountains of Colorado, I found myself constantly 
                    struggling with the same problem: <em>finding and chasing performance metrics</em> across 
                    multiple tools and platforms. The pain was real - scattered data, confusing interfaces, 
                    and expensive solutions that didn't quite fit my needs.
                  </p>
                  
                  <p className="text-lg leading-relaxed mb-6">
                    After finding the metrics, sometimes partial, sometimes complete, I didn't know what to do. 
                    Then research again ensued, perusing one website page after another to find solutions. 
                    Hours turned into days, days into weeks, as I dug through documentation, forums, and 
                    countless articles. And then I figured it out myself.
                  </p>
                  
                  <p className="text-lg leading-relaxed mb-6">
                    So I did what any developer would do - I built my own solution. PageRodeo started as a 
                    personal project to consolidate all the performance testing, monitoring, and analysis 
                    tools I needed into one simple, powerful platform.
                  </p>
                  
                  <p className="text-lg leading-relaxed mb-6">
                    <strong>If you have the time to figure it out yourself, do so.</strong> But if not, 
                    let our service consultants help you sort it out. We understand the frustration of 
                    knowing what's wrong but not knowing how to fix it - that's where our expertise comes in.
                  </p>
                  
                  <p className="text-lg leading-relaxed">
                    What began as a way to solve my own problems has evolved into something I'm proud to 
                    share with fellow developers, marketers, and business owners who face the same challenges 
                    I did. Every feature is built with real-world experience and genuine care for the user experience.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mission & Values */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <Target className="h-6 w-6 text-palette-primary" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed">
                  To simplify website performance optimization by providing comprehensive, 
                  easy-to-use tools that give you the insights you need without the complexity 
                  you don't. We believe that great performance should be accessible to everyone, 
                  not just enterprise teams with big budgets.
                </p>
              </CardContent>
            </Card>

            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <Heart className="h-6 w-6 text-palette-primary" />
                  Our Values
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Simplicity over complexity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Real solutions for real problems</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Transparent and honest communication</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Continuous improvement based on feedback</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Current Features */}
          <div className="mb-16">
            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2 text-2xl">
                  <Zap className="h-7 w-7 text-palette-primary" />
                  What We Offer Today
                </CardTitle>
                <CardDescription className="text-slate-600 text-lg">
                  The features that are currently available and ready to use
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-palette-accent-3 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-palette-primary" />
                      </div>
                      <h4 className="font-semibold text-slate-800">Performance Testing</h4>
                    </div>
                    <p className="text-sm text-slate-600">Real Google PageSpeed Insights integration with AI-powered recommendations</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-palette-accent-3 flex items-center justify-center">
                        <Globe className="h-5 w-5 text-palette-primary" />
                      </div>
                      <h4 className="font-semibold text-slate-800">Website Monitoring</h4>
                    </div>
                    <p className="text-sm text-slate-600">Uptime monitoring, response time tracking, and SSL certificate validation</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-palette-accent-3 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-palette-primary" />
                      </div>
                      <h4 className="font-semibold text-slate-800">SSL & Domain Analysis</h4>
                    </div>
                    <p className="text-sm text-slate-600">Comprehensive SSL certificate and domain information checking</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-palette-accent-3 flex items-center justify-center">
                        <Brain className="h-5 w-5 text-palette-primary" />
                      </div>
                      <h4 className="font-semibold text-slate-800">AI Health Monitoring</h4>
                    </div>
                    <p className="text-sm text-slate-600">Monitor AI model performance, costs, and system health in real-time</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-palette-accent-3 flex items-center justify-center">
                        <Target className="h-5 w-5 text-palette-primary" />
                      </div>
                      <h4 className="font-semibold text-slate-800">Sitemap Generation</h4>
                    </div>
                    <p className="text-sm text-slate-600">Intelligent website crawling and XML sitemap generation</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-palette-accent-3 flex items-center justify-center">
                        <Users className="h-5 w-5 text-palette-primary" />
                      </div>
                      <h4 className="font-semibold text-slate-800">API Health Checker</h4>
                    </div>
                    <p className="text-sm text-slate-600">Automated API discovery and comprehensive endpoint testing</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="mb-16">
            <Card className="border-green-200/50 shadow-lg bg-green-50/50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2 text-2xl">
                  <DollarSign className="h-7 w-7" />
                  Support the Journey
                </CardTitle>
                <CardDescription className="text-green-700 text-lg">
                  Help us continue building and improving PageRodeo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose prose-lg max-w-none text-green-800">
                  <p className="text-xl leading-relaxed mb-4">
                    <strong>For features to be implemented, please buy the services if it's currently useful.</strong>
                  </p>
                  
                  <p className="text-lg leading-relaxed mb-6">
                    If not, provide feedback to make it better. Every purchase helps fund new features, 
                    better infrastructure, and continued development. Your support directly enables:
                  </p>
                  
                  <ul className="space-y-3 text-lg">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>New feature development and improvements</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Better server infrastructure and reliability</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Faster response times and enhanced performance</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>More comprehensive testing and quality assurance</span>
                    </li>
                  </ul>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button 
                    asChild
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-green-500/25 transition-all duration-300"
                  >
                    <Link href="/upgrade">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Support PageRodeo
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                  
                  <Button 
                    asChild
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Link href="/feedback">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Provide Feedback
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}
