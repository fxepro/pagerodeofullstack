"use client"

import React from "react"
import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  Clock,
  FileText,
  TrendingUp,
  Zap,
  Globe,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Download,
  Share,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { ConsultationCTA } from "@/components/consultation-cta"

interface AnalysisData {
  url: string
  loadTime: number
  pageSize: number
  requests: number
  performanceScore: number
  coreWebVitals: {
    lcp: number
    fid: number
    cls: number
  }
  recommendations: string[]
  timestamp: string
  lighthouseResults?: {
    accessibility: number
    bestPractices: number
    seo: number
  }
  resources?: Array<{
    name: string
    type: string
    size: number
    startTime: number
    duration: number
    status: number
  }>
  timeline?: {
    domContentLoaded: number
    loadComplete: number
    firstPaint: number
    firstContentfulPaint: number
    largestContentfulPaint: number
  }
}

export function ResultsContent() {
  const searchParams = useSearchParams()
  const url = searchParams.get("url") || "example.com"
  const [data, setData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    analyzeWebsite()
  }, [url])

  const analyzeWebsite = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting analysis for:", url)
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Analysis failed")
      }

      const analysisData = await response.json()
      console.log("[v0] Analysis completed:", analysisData)
      setData(analysisData)
    } catch (err) {
      console.error("[v0] Analysis error:", err)
      setError(err instanceof Error ? err.message : "Failed to analyze website")
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-palette-primary"
    if (score >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { 
      variant: "default" as const, 
      text: "Excellent", 
      icon: CheckCircle,
      bgColor: "bg-green-500",
      textColor: "text-white"
    }
    if (score >= 70) return { 
      variant: "secondary" as const, 
      text: "Good", 
      icon: CheckCircle,
      bgColor: "bg-green-500",
      textColor: "text-white"
    }
    if (score >= 50) return { 
      variant: "default" as const, 
      text: "Needs Improvement", 
      icon: AlertTriangle,
      bgColor: "bg-orange-500",
      textColor: "text-white"
    }
    return { 
      variant: "destructive" as const, 
      text: "Poor", 
      icon: AlertTriangle,
      bgColor: "bg-red-500",
      textColor: "text-white"
    }
  }

  const formatTime = (seconds: number) => {
    return `${seconds.toFixed(2)}s`
  }

  const formatSize = (mb: number) => {
    return `${mb.toFixed(1)} MB`
  }

  const formatMs = (ms: number) => {
    return `${Math.round(ms)}ms`
  }

  const formatCLS = (cls: number) => {
    return cls.toFixed(3)
  }

  const downloadReport = (data: AnalysisData) => {
    // Create a comprehensive report
    const report = {
      title: `Performance Report - ${data.url}`,
      timestamp: data.timestamp,
      summary: {
        url: data.url,
        performanceScore: data.performanceScore,
        loadTime: `${data.loadTime.toFixed(2)}s`,
        pageSize: `${data.pageSize.toFixed(2)} MB`,
        requests: data.requests,
      },
      coreWebVitals: {
        lcp: `${data.coreWebVitals.lcp.toFixed(2)}s`,
        fid: `${data.coreWebVitals.fid.toFixed(0)}ms`,
        cls: data.coreWebVitals.cls.toFixed(3),
      },
      lighthouseResults: data.lighthouseResults ? {
        accessibility: data.lighthouseResults.accessibility,
        bestPractices: data.lighthouseResults.bestPractices,
        seo: data.lighthouseResults.seo,
      } : null,
      recommendations: data.recommendations,
      resources: data.resources || [],
      timeline: data.timeline || {},
    }

    // Convert to JSON and download
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pagerodeo-report-${data.url.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    // Show success message
    toast({
      title: "Download Complete!",
      description: "Performance report has been downloaded",
    })
  }

  const shareResults = async (data: AnalysisData) => {
    // Create a shareable summary
    const summary = `🚀 Performance Report for ${data.url}

📊 Overall Score: ${data.performanceScore}/100
⚡ Load Time: ${data.loadTime.toFixed(2)}s
📦 Page Size: ${data.pageSize.toFixed(2)} MB
🔗 Requests: ${data.requests}

🎯 Core Web Vitals:
• LCP: ${data.coreWebVitals.lcp.toFixed(2)}s
• FID: ${data.coreWebVitals.fid.toFixed(0)}ms  
• CLS: ${data.coreWebVitals.cls.toFixed(3)}

💡 Key Recommendations:
${data.recommendations.slice(0, 3).map(rec => `• ${rec}`).join('\n')}

🔍 Test your website at pagerodeo.com`

    try {
      if (navigator.share) {
        // Use native sharing if available (mobile)
        await navigator.share({
          title: `Performance Report - ${data.url}`,
          text: summary,
          url: window.location.href
        })
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(summary)
        
        // Show success message using toast
        toast({
          title: "Success!",
          description: "Performance summary copied to clipboard",
        })
      }
    } catch (error) {
      console.error('Error sharing results:', error)
      
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(summary)
        toast({
          title: "Success!",
          description: "Performance summary copied to clipboard",
        })
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError)
        toast({
          title: "Error",
          description: "Failed to share results. Please copy manually.",
          variant: "destructive",
        })
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-palette-primary to-palette-primary-hover text-white">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-white/70 mb-6">
                <Globe className="h-5 w-5" />
                <span className="text-lg">{url}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-4">Analyzing Performance...</h1>
              <div className="flex items-center justify-center gap-2 text-white/70">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Running real Lighthouse analysis, this may take 30-60 seconds</span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Performance Metrics Skeleton */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-white/80 backdrop-blur-sm border-palette-accent-2 shadow-lg">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-20 bg-palette-accent-2" />
                    <Skeleton className="h-8 w-16 bg-palette-accent-3" />
                    <Skeleton className="h-3 w-full bg-palette-accent-3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Core Web Vitals Skeleton */}
          <Card className="bg-white/80 backdrop-blur-sm border-palette-accent-2 shadow-lg mb-8">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-48 bg-palette-accent-3 mb-4" />
              <div className="grid md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-4 w-32 bg-palette-accent-2" />
                    <Skeleton className="h-6 w-20 bg-palette-accent-3" />
                    <Skeleton className="h-2 w-full bg-palette-accent-3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations Skeleton */}
          <Card className="bg-white/80 backdrop-blur-sm border-palette-accent-2 shadow-lg">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-40 bg-palette-accent-3 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4 bg-palette-accent-2 rounded-full" />
                    <Skeleton className="h-4 flex-1 bg-palette-accent-3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Globe className="h-4 w-4" />
            <span>{url}</span>
          </div>
          <h1 className="text-3xl font-bold mb-4">Analysis Failed</h1>
        </div>

        <Alert variant="destructive" className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <Button onClick={analyzeWebsite} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  if (!data) return null

  const scoreBadge = getScoreBadge(data.performanceScore)

  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-palette-primary to-palette-primary-hover text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-white/70 mb-6">
              <Globe className="h-5 w-5" />
              <span className="text-lg">{data.url}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-4">Performance Analysis Results</h1>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Badge 
                className={`flex items-center gap-2 px-4 py-2 text-base ${scoreBadge.bgColor} ${scoreBadge.textColor} border-0 shadow-lg`}
              >
                <scoreBadge.icon className="h-4 w-4" />
                {scoreBadge.text}
              </Badge>
              <div className="text-white/70 text-center">
                <div className="font-medium">
                  Analyzed {new Date(data.timestamp).toLocaleDateString()} at {new Date(data.timestamp).toLocaleTimeString()}
                </div>
                <div className="text-sm text-white/60 flex items-center justify-center gap-1 mt-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Global Analysis Server
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={analyzeWebsite}
                className="border-palette-accent-2 text-white hover:bg-palette-accent-3 hover:text-palette-primary"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-analyze
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="border-0 shadow-lg bg-palette-accent-3 hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-8 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-700 mb-2">Load Time</p>
                  <p
                    className={`text-3xl font-bold ${data.loadTime <= 2 ? "text-slate-800" : data.loadTime <= 4 ? "text-yellow-700" : "text-red-700"}`}
                  >
                    {formatTime(data.loadTime)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-white/30 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-slate-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-palette-accent-3 hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-8 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-700 mb-2">Page Size</p>
                  <p className="text-3xl font-bold text-slate-800">{formatSize(data.pageSize)}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-white/30 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-slate-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-palette-accent-3 hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-8 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-700 mb-2">Requests</p>
                  <p className="text-3xl font-bold text-slate-800">{data.requests}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-white/30 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-slate-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-palette-accent-3 hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-8 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-700 mb-2">Performance Score</p>
                  <p className="text-3xl font-bold text-slate-800">{data.performanceScore}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-white/30 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-slate-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Core Web Vitals */}
        <Card className="mb-8 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Core Web Vitals</CardTitle>
          <CardDescription>Key metrics that measure real-world user experience</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-foreground">Largest Contentful Paint (LCP)</span>
                <span
                  className={`text-xl font-bold ${data.coreWebVitals.lcp <= 2.5 ? "text-palette-primary" : "text-yellow-600"}`}
                >
                  {formatTime(data.coreWebVitals.lcp)}
                </span>
              </div>
              <Progress value={((2.5 - Math.min(data.coreWebVitals.lcp, 2.5)) / 2.5) * 100} className="h-2 bg-palette-accent-2 [&>div]:bg-palette-accent-1" />
              <p className="text-xs text-muted-foreground">Good: ≤ 2.5s</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-foreground">First Input Delay (FID)</span>
                <span
                  className={`text-xl font-bold ${data.coreWebVitals.fid <= 100 ? "text-palette-primary" : "text-yellow-600"}`}
                >
                  {formatMs(data.coreWebVitals.fid)}
                </span>
              </div>
              <Progress value={((100 - Math.min(data.coreWebVitals.fid, 100)) / 100) * 100} className="h-2 bg-palette-accent-2 [&>div]:bg-palette-accent-1" />
              <p className="text-xs text-muted-foreground">Good: ≤ 100ms</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-foreground">Cumulative Layout Shift (CLS)</span>
                <span
                  className={`text-xl font-bold ${data.coreWebVitals.cls <= 0.1 ? "text-palette-primary" : "text-yellow-600"}`}
                >
                  {formatCLS(data.coreWebVitals.cls)}
                </span>
              </div>
              <Progress value={((0.1 - Math.min(data.coreWebVitals.cls, 0.1)) / 0.1) * 100} className="h-2 bg-palette-accent-2 [&>div]:bg-palette-accent-1" />
              <p className="text-xs text-muted-foreground">Good: ≤ 0.1</p>
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Lighthouse Scores */}
        {data.lighthouseResults && (
          <Card className="mb-8 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Lighthouse Scores</CardTitle>
            <CardDescription>Comprehensive performance analysis across multiple categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-foreground">Performance</span>
                  <span className={`text-xl font-bold ${getScoreColor(data.performanceScore)}`}>
                    {data.performanceScore}
                  </span>
                </div>
                <Progress value={data.performanceScore} className="h-2 bg-palette-accent-2 [&>div]:bg-palette-accent-1" />
                <p className="text-xs text-muted-foreground">Core performance metrics</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-foreground">Accessibility</span>
                  <span className={`text-xl font-bold ${getScoreColor(data.lighthouseResults.accessibility)}`}>
                    {data.lighthouseResults.accessibility}
                  </span>
                </div>
                <Progress value={data.lighthouseResults.accessibility} className="h-2 bg-palette-accent-2 [&>div]:bg-palette-accent-1" />
                <p className="text-xs text-muted-foreground">WCAG compliance</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-foreground">Best Practices</span>
                  <span className={`text-xl font-bold ${getScoreColor(data.lighthouseResults.bestPractices)}`}>
                    {data.lighthouseResults.bestPractices}
                  </span>
                </div>
                <Progress value={data.lighthouseResults.bestPractices} className="h-2 bg-palette-accent-2 [&>div]:bg-palette-accent-1" />
                <p className="text-xs text-muted-foreground">Development standards</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-foreground">SEO</span>
                  <span className={`text-xl font-bold ${getScoreColor(data.lighthouseResults.seo)}`}>
                    {data.lighthouseResults.seo}
                  </span>
                </div>
                <Progress value={data.lighthouseResults.seo} className="h-2 bg-palette-accent-2 [&>div]:bg-palette-accent-1" />
                <p className="text-xs text-muted-foreground">Search optimization</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

        {/* Quick Recommendations */}
        <Card className="mb-8 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Performance Recommendations</CardTitle>
          <CardDescription>Lighthouse-powered suggestions to improve your website</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recommendations.map((recommendation, index) => (
              <Alert key={index}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{recommendation}</AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button 
            asChild 
            size="lg"
            className="bg-gradient-to-r from-palette-primary to-palette-primary-hover hover:from-palette-primary-hover hover:to-palette-secondary text-white shadow-lg"
          >
            <Link href={`/results/detailed?url=${encodeURIComponent(data.url)}`}>
              <BarChart3 className="h-4 w-4 mr-2" />
              View Detailed Analysis
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => downloadReport(data)}
            className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3 bg-white/80 backdrop-blur-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => shareResults(data)}
            className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3 bg-white/80 backdrop-blur-sm"
          >
            <Share className="h-4 w-4 mr-2" />
            Share Results
          </Button>
        </div>

        {/* Call to Action Section */}
        <ConsultationCTA
          title="Need Help Optimizing Your Website Performance?"
          description="Our expert consultants can help you analyze your performance data, implement optimizations, and achieve better results."
          secondaryButtonHref="/performance-info"
        />
      </div>
    </div>
  )
}
