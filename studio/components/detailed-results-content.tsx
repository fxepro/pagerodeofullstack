"use client"

import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { WaterfallChart } from "@/components/waterfall-chart"
import { ResourceBreakdown } from "@/components/resource-breakdown"
import { PerformanceTimeline } from "@/components/performance-timeline"
import { LLMFeedback } from "@/components/llm-feedback"
import { Globe, ArrowLeft, Download, Share, RefreshCw, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { ConsultationCTA } from "@/components/consultation-cta"

interface DetailedAnalysisData {
  url: string
  resources: Array<{
    name: string
    type: string
    size: number
    startTime: number
    duration: number
    status: number
  }>
  timeline: {
    domContentLoaded: number
    loadComplete: number
    firstPaint: number
    firstContentfulPaint: number
    largestContentfulPaint: number
  }
  totalSize: number
  totalRequests: number
  loadTime: number
}

export function DetailedResultsContent() {
  const searchParams = useSearchParams()
  const url = searchParams.get("url") || "example.com"
  const [data, setData] = useState<DetailedAnalysisData | null>(null)
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
      console.log("[v0] Starting detailed analysis for:", url)
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
      console.log("[v0] Detailed analysis completed:", analysisData)

      const detailedData: DetailedAnalysisData = {
        url: analysisData.url,
        resources: analysisData.resources || [],
        timeline: analysisData.timeline || {},
        totalSize: analysisData.resources?.reduce((sum: number, r: any) => sum + r.size, 0) || 0,
        totalRequests: analysisData.resources?.length || 0,
        loadTime: analysisData.loadTime || 0,
      }

      setData(detailedData)
    } catch (err) {
      console.error("[v0] Detailed analysis error:", err)
      setError(err instanceof Error ? err.message : "Failed to analyze website")
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = (data: DetailedAnalysisData) => {
    // Create a comprehensive detailed report
    const report = {
      title: `Detailed Performance Report - ${data.url}`,
      timestamp: new Date().toISOString(),
      summary: {
        url: data.url,
        totalRequests: data.totalRequests,
        totalSize: `${data.totalSize.toFixed(1)} KB`,
        loadTime: `${data.loadTime.toFixed(1)}s`,
      },
      performanceTimeline: {
        firstPaint: `${data.timeline.firstPaint}ms`,
        firstContentfulPaint: `${data.timeline.firstContentfulPaint}ms`,
        largestContentfulPaint: `${data.timeline.largestContentfulPaint}ms`,
        domContentLoaded: `${data.timeline.domContentLoaded}ms`,
        loadComplete: `${data.timeline.loadComplete}ms`,
      },
      resourceAnalysis: {
        totalResources: data.resources.length,
        resourcesByType: data.resources.reduce((acc, resource) => {
          if (!acc[resource.type]) {
            acc[resource.type] = { count: 0, totalSize: 0, resources: [] }
          }
          acc[resource.type].count++
          acc[resource.type].totalSize += resource.size
          acc[resource.type].resources.push({
            name: resource.name,
            size: `${resource.size.toFixed(1)} KB`,
            startTime: `${resource.startTime}ms`,
            duration: `${resource.duration}ms`,
            status: resource.status,
          })
          return acc
        }, {} as Record<string, any>),
      },
      detailedResources: data.resources.map(resource => ({
        name: resource.name,
        type: resource.type,
        size: `${resource.size.toFixed(1)} KB`,
        startTime: `${resource.startTime}ms`,
        duration: `${resource.duration}ms`,
        status: resource.status,
      })),
      performanceInsights: {
        loadTimeAnalysis: data.loadTime > 3000 ? "Slow - exceeds 3s target" : "Good - within 3s target",
        resourceEfficiency: data.totalRequests > 40 ? "High request count - consider optimization" : "Optimized request count",
        sizeOptimization: data.totalSize > 2000 ? "Large total size - image and asset optimization recommended" : "Good total size",
      },
    }

    // Convert to JSON and download
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pagerodeo-detailed-report-${data.url.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    // Show success message
    toast({
      title: "Download Complete!",
      description: "Detailed performance report has been downloaded",
    })
  }

  const shareAnalysis = async (data: DetailedAnalysisData) => {
    // Create a shareable detailed summary
    const summary = `🔍 Detailed Performance Analysis for ${data.url}

📊 Performance Overview:
• Total Requests: ${data.totalRequests}
• Total Size: ${data.totalSize.toFixed(1)} KB
• Load Time: ${data.loadTime.toFixed(1)}s

⏱️ Performance Timeline:
• First Paint: ${data.timeline.firstPaint}ms
• First Contentful Paint: ${data.timeline.firstContentfulPaint}ms
• Largest Contentful Paint: ${data.timeline.largestContentfulPaint}ms
• DOM Content Loaded: ${data.timeline.domContentLoaded}ms

📁 Resource Analysis:
• Total Resources: ${data.resources.length}
• Resource Types: ${Object.keys(data.resources.reduce((acc, r) => { acc[r.type] = true; return acc }, {} as Record<string, boolean>)).join(', ')}

🔍 Get your detailed analysis at pagerodeo.com`

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Performance Analysis - ${data.url}`,
          text: summary,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(summary)
        toast({
          title: "Success!",
          description: "Detailed performance summary copied to clipboard",
        })
      }
    } catch (error) {
      console.error("Failed to share:", error)
      toast({
        title: "Error",
        description: "Failed to share analysis. Please try copying manually.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
        <div className="bg-gradient-to-r from-palette-primary to-palette-primary-hover text-white">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-purple-200 mb-6">
                <Globe className="h-5 w-5" />
                <span className="text-lg">{url}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-4">Analyzing Performance...</h1>
              <div className="flex items-center justify-center gap-2 text-purple-200">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Running detailed Lighthouse analysis...</span>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
        <div className="bg-gradient-to-r from-palette-primary to-palette-primary-hover text-white">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-purple-200 mb-6">
                <Globe className="h-5 w-5" />
                <span className="text-lg">{url}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-4">Analysis Failed</h1>
              <div className="flex items-center justify-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild
                  className="text-purple-200 hover:text-white hover:bg-white/20"
                >
                  <Link href={`/results?url=${encodeURIComponent(url)}`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Summary
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive" className="mb-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <Button 
            onClick={analyzeWebsite} 
            className="flex items-center gap-2 bg-gradient-to-r from-palette-primary to-palette-primary-hover hover:from-purple-700 hover:to-palette-secondary"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
      {/* Header Section - Updated Styling */}
      <div className="bg-gradient-to-r from-palette-primary to-palette-primary-hover text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-purple-200 mb-6">
              <Globe className="h-5 w-5" />
              <span className="text-lg">{data.url}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-4">Detailed Performance Analysis</h1>
            <div className="text-purple-200 text-center mb-4">
              <div className="font-medium">
                Analyzed {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </div>
              <div className="text-sm text-purple-300 flex items-center justify-center gap-1 mt-1">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Global Analysis Server
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
              <Badge className="bg-palette-accent-3 text-slate-700 border-0 px-4 py-2 text-base shadow-lg">
                {data.totalRequests} requests
              </Badge>
              <Badge className="bg-palette-accent-3 text-slate-700 border-0 px-4 py-2 text-base shadow-lg">
                {data.totalSize.toFixed(1)} KB total
              </Badge>
              <Badge className="bg-palette-accent-3 text-slate-700 border-0 px-4 py-2 text-base shadow-lg">
                {data.loadTime.toFixed(1)}s load time
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={analyzeWebsite}
                className="border-palette-accent-2 text-purple-100 hover:bg-palette-accent-3 hover:text-palette-primary"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-analyze
              </Button>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                asChild
                className="text-purple-200 hover:text-white hover:bg-white/20"
              >
                <Link href={`/results?url=${encodeURIComponent(url)}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Summary
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">

        {/* Main Content */}
        <Tabs defaultValue="waterfall" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-palette-accent-3 border-palette-accent-2">
            <TabsTrigger value="waterfall" className="data-[state=active]:bg-palette-accent-1 data-[state=active]:text-white">Waterfall Chart</TabsTrigger>
            <TabsTrigger value="resources" className="data-[state=active]:bg-palette-accent-1 data-[state=active]:text-white">Resource Breakdown</TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-palette-accent-1 data-[state=active]:text-white">Performance Timeline</TabsTrigger>
            <TabsTrigger value="ai-insights" className="data-[state=active]:bg-palette-accent-1 data-[state=active]:text-white">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="waterfall" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-palette-primary">Resource Loading Waterfall</CardTitle>
                <CardDescription>
                  Real-time timeline from Lighthouse showing when each resource was requested and loaded
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WaterfallChart resources={data.resources} timeline={data.timeline} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <ResourceBreakdown resources={data.resources} />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <PerformanceTimeline timeline={data.timeline} />
          </TabsContent>

          <TabsContent value="ai-insights" className="space-y-6">
            <LLMFeedback url={data.url} performanceData={data} />
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mt-8">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => downloadReport(data)}
            className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3 bg-white/80 backdrop-blur-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => shareAnalysis(data)}
            className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3 bg-white/80 backdrop-blur-sm"
          >
            <Share className="h-4 w-4 mr-2" />
            Share Analysis
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
