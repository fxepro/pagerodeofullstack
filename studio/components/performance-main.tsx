"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WaterfallChart } from "@/components/waterfall-chart"
import { ResourceBreakdown } from "@/components/resource-breakdown"
import { PerformanceTimeline } from "@/components/performance-timeline"
import { LLMFeedback } from "@/components/llm-feedback"
import { useToast } from "@/hooks/use-toast"
import { usePerformanceAnalysis } from "@/hooks/use-performance-analysis"
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
import { ErrorDisplay } from "@/components/error-display"

interface DetailedData {
  url: string;
  resources: Array<{
    name: string;
    type: string;
    size: number;
    startTime: number;
    duration: number;
    status: number;
  }>;
  timeline: {
    domContentLoaded: number;
    loadComplete: number;
    firstPaint: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
  };
  totalSize: number;
  totalRequests: number;
  loadTime: number;
}

interface PerformanceMainProps {
  url?: string;
}

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
}

export function PerformanceMain({ url: initialUrl = "" }: PerformanceMainProps) {
  const { toast } = useToast();
  const {
    url,
    setUrl,
    data,
    loading,
    error,
    isRetrying,
    clearError,
    analyzeWebsite,
    downloadReport,
    shareResults,
  } = usePerformanceAnalysis({ initialUrl, autoRun: !!initialUrl })
  const [detailedData, setDetailedData] = useState<DetailedData | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showDetailed, setShowDetailed] = useState(false);

  useEffect(() => {
    if (data && !detailedData) {
      fetchDetailedData();
    }
  }, [data]);

  const fetchDetailedData = async () => {
    if (!data) return;
    setLoadingDetails(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: data.url }),
      });
      
      // Check content type to ensure we got JSON, not HTML
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Received non-JSON response:", text.substring(0, 200));
        return;
      }
      
      if (response.ok) {
        const analysisData = await response.json();
        setDetailedData({
          url: data.url,
          resources: analysisData.resources || [],
          timeline: analysisData.timeline || {},
          totalSize: analysisData.resources?.reduce((sum: number, r: any) => sum + r.size, 0) || 0,
          totalRequests: analysisData.resources?.length || 0,
          loadTime: analysisData.loadTime || 0,
        });
      } else {
        // Try to parse error response
        try {
          const errorData = await response.json();
          console.error("API error:", errorData.error || errorData);
        } catch (parseError) {
          console.error("API returned non-JSON error response");
        }
      }
    } catch (err) {
      console.error("Failed to fetch detailed data:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-palette-primary";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { 
      variant: "default" as const, 
      text: "Excellent", 
      icon: CheckCircle,
      bgColor: "bg-green-500",
      textColor: "text-white"
    };
    if (score >= 70) return { 
      variant: "secondary" as const, 
      text: "Good", 
      icon: CheckCircle,
      bgColor: "bg-green-500",
      textColor: "text-white"
    };
    if (score >= 50) return { 
      variant: "default" as const, 
      text: "Needs Improvement", 
      icon: AlertTriangle,
      bgColor: "bg-orange-500",
      textColor: "text-white"
    };
    return { 
      variant: "destructive" as const, 
      text: "Poor", 
      icon: AlertTriangle,
      bgColor: "bg-red-500",
      textColor: "text-white"
    };
  };

  const formatTime = (seconds: number) => {
    return `${seconds.toFixed(2)}s`;
  };

  const formatSize = (mb: number) => {
    return `${mb.toFixed(1)} MB`;
  };

  const formatMs = (ms: number) => {
    return `${Math.round(ms)}ms`;
  };

  const formatCLS = (cls: number) => {
    return cls.toFixed(3);
  };

  const downloadReportLocal = (data: AnalysisData) => {
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
    };

    // Convert to JSON and download
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagerodeo-report-${data.url.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show success message
    toast({ title: "Download Complete!", description: "Performance report has been downloaded" });
  };

  const shareResultsLocal = async (data: AnalysisData) => {
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

🔍 Test your website at pagerodeo.com`;

    try {
      if (navigator.share) {
        // Use native sharing if available (mobile)
        await navigator.share({
          title: `Performance Report - ${data.url}`,
          text: summary,
          url: window.location.href
        });
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(summary);
        toast({ title: "Success!", description: "Performance summary copied to clipboard" });
      }
    } catch (error) {
      console.error('Error sharing results:', error);
      try {
        await navigator.clipboard.writeText(summary);
        toast({ title: "Success!", description: "Performance summary copied to clipboard" });
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
        toast({ title: "Error", description: "Failed to share results. Please copy manually.", variant: "destructive" });
      }
    }
  };

  // When used in dashboard (has initialUrl), return early with minimal layout
  if (initialUrl) {
    if (loading) {
      return (
        <div className="p-6">
          <div className="text-center py-8">
            <RefreshCw className="animate-spin h-12 w-12 text-palette-primary mx-auto mb-4" />
            <p className="text-slate-600">Analyzing performance for {initialUrl}...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-6">
          <ErrorDisplay 
            error={error}
            onRetry={analyzeWebsite}
            onDismiss={clearError}
            isRetrying={isRetrying}
            variant="alert"
          />
        </div>
      );
    }

    if (!data) return null;

    // Use dashboard rendering for initial URL mode
    return (
      <div className="p-6">
        <div className="space-y-6">
          {/* Same rendering as standalone below */}
          {/* Half-height Header Strip */}
          <div className="bg-gradient-to-r from-palette-primary to-palette-primary-hover text-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-200">
                  <Globe className="h-5 w-5" />
                  <span className="text-lg font-medium">{data.url}</span>
                </div>
                <Button 
                  onClick={analyzeWebsite} 
                  disabled={loading}
                  variant="outline" 
                  className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3 hover:text-palette-primary"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Re-analyze
                </Button>
              </div>
              
              <div className="flex items-center gap-4 flex-wrap">
                <Badge className="bg-palette-accent-3 text-slate-700 border-0 px-3 py-1 text-sm">
                  {data.requests} requests
                </Badge>
                <Badge className="bg-palette-accent-3 text-slate-700 border-0 px-3 py-1 text-sm">
                  {(data.pageSize * 1024).toFixed(1)} KB total
                </Badge>
                <Badge className="bg-palette-accent-3 text-slate-700 border-0 px-3 py-1 text-sm">
                  {data.loadTime.toFixed(1)}s load time
                </Badge>
                <span className="text-purple-200 text-sm ml-auto">
                  Analyzed {new Date(data.timestamp).toLocaleDateString()} at {new Date(data.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {/* Main Performance Summary */}
          <div className="grid md:grid-cols-4 gap-6 mb-6">
            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Load Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{data.loadTime.toFixed(2)}s</div>
              </CardContent>
            </Card>
            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Page Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{data.pageSize.toFixed(2)} MB</div>
              </CardContent>
            </Card>
            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{data.requests}</div>
              </CardContent>
            </Card>
            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Performance Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-palette-primary">{data.performanceScore}</div>
              </CardContent>
            </Card>
          </div>

          {/* Core Web Vitals */}
          <Card className="mb-6 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Core Web Vitals</CardTitle>
              <CardDescription>Key metrics that measure real-world user experience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-foreground">Largest Contentful Paint (LCP)</span>
                    <span className={`text-xl font-bold ${data.coreWebVitals.lcp <= 2.5 ? "text-palette-primary" : "text-yellow-600"}`}>
                      {data.coreWebVitals.lcp.toFixed(2)}s
                    </span>
                  </div>
                  <Progress value={((2.5 - Math.min(data.coreWebVitals.lcp, 2.5)) / 2.5) * 100} className="h-2 bg-palette-accent-2 [&>div]:bg-palette-accent-1" />
                  <p className="text-xs text-muted-foreground">Good: ≤ 2.5s</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-foreground">First Input Delay (FID)</span>
                    <span className={`text-xl font-bold ${data.coreWebVitals.fid <= 100 ? "text-palette-primary" : "text-yellow-600"}`}>
                      {Math.round(data.coreWebVitals.fid)}ms
                    </span>
                  </div>
                  <Progress value={((100 - Math.min(data.coreWebVitals.fid, 100)) / 100) * 100} className="h-2 bg-palette-accent-2 [&>div]:bg-palette-accent-1" />
                  <p className="text-xs text-muted-foreground">Good: ≤ 100ms</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-foreground">Cumulative Layout Shift (CLS)</span>
                    <span className={`text-xl font-bold ${data.coreWebVitals.cls <= 0.1 ? "text-palette-primary" : "text-yellow-600"}`}>
                      {data.coreWebVitals.cls.toFixed(3)}
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
            <Card className="mb-6 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Lighthouse Scores</CardTitle>
                <CardDescription>Comprehensive performance analysis across multiple categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-foreground">Performance</span>
                      <span className={`text-xl font-bold ${data.performanceScore >= 90 ? "text-palette-primary" : data.performanceScore >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                        {data.performanceScore}
                      </span>
                    </div>
                    <Progress value={data.performanceScore} className="h-2 bg-palette-accent-2 [&>div]:bg-palette-accent-1" />
                    <p className="text-xs text-muted-foreground">Core performance metrics</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-foreground">Accessibility</span>
                      <span className={`text-xl font-bold ${data.lighthouseResults.accessibility >= 90 ? "text-palette-primary" : data.lighthouseResults.accessibility >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                        {data.lighthouseResults.accessibility}
                      </span>
                    </div>
                    <Progress value={data.lighthouseResults.accessibility} className="h-2 bg-palette-accent-2 [&>div]:bg-palette-accent-1" />
                    <p className="text-xs text-muted-foreground">WCAG compliance</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-foreground">Best Practices</span>
                      <span className={`text-xl font-bold ${data.lighthouseResults.bestPractices >= 90 ? "text-palette-primary" : data.lighthouseResults.bestPractices >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                        {data.lighthouseResults.bestPractices}
                      </span>
                    </div>
                    <Progress value={data.lighthouseResults.bestPractices} className="h-2 bg-palette-accent-2 [&>div]:bg-palette-accent-1" />
                    <p className="text-xs text-muted-foreground">Development standards</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-foreground">SEO</span>
                      <span className={`text-xl font-bold ${data.lighthouseResults.seo >= 90 ? "text-palette-primary" : data.lighthouseResults.seo >= 50 ? "text-yellow-600" : "text-red-600"}`}>
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

          {/* Performance Recommendations */}
          <Card className="mb-6 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
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

          {/* View Detailed Analysis Button */}
          <div className="flex justify-center">
            <Button 
              onClick={() => setShowDetailed(!showDetailed)}
              size="lg"
              className="bg-gradient-to-r from-palette-primary to-palette-primary-hover hover:from-purple-700 hover:to-palette-secondary text-white shadow-lg"
            >
              <Clock className="h-4 w-4 mr-2" />
              {showDetailed ? "Hide Detailed Analysis" : "View Detailed Analysis"}
            </Button>
          </div>

          {/* Detailed Analysis Tabs */}
          {showDetailed && !loadingDetails && detailedData && (
            <Tabs defaultValue="waterfall" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-palette-accent-3 border-palette-accent-2">
                <TabsTrigger value="waterfall" className="data-[state=active]:bg-palette-accent-1 data-[state=active]:text-white">
                  Waterfall Chart
                </TabsTrigger>
                <TabsTrigger value="resources" className="data-[state=active]:bg-palette-accent-1 data-[state=active]:text-white">
                  Resource Breakdown
                </TabsTrigger>
                <TabsTrigger value="timeline" className="data-[state=active]:bg-palette-accent-1 data-[state=active]:text-white">
                  Performance Timeline
                </TabsTrigger>
                <TabsTrigger value="ai-insights" className="data-[state=active]:bg-palette-accent-1 data-[state=active]:text-white">
                  AI Insights
                </TabsTrigger>
              </TabsList>

              <TabsContent value="waterfall" className="mt-6">
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-palette-primary">Resource Loading Waterfall</CardTitle>
                    <CardDescription>
                      Real-time timeline from Lighthouse showing when each resource was requested and loaded
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <WaterfallChart resources={detailedData.resources} timeline={detailedData.timeline} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resources" className="mt-6">
                <ResourceBreakdown resources={detailedData.resources} />
              </TabsContent>

              <TabsContent value="timeline" className="mt-6">
                <PerformanceTimeline timeline={detailedData.timeline} />
              </TabsContent>

              <TabsContent value="ai-insights" className="mt-6">
                <LLMFeedback url={detailedData.url} performanceData={detailedData} />
              </TabsContent>
            </Tabs>
          )}

          {showDetailed && loadingDetails && (
            <div className="text-center py-8">
              <RefreshCw className="animate-spin h-8 w-8 text-palette-primary mx-auto mb-2" />
              <p className="text-slate-600">Loading detailed analysis...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default return for standalone page (no initialUrl prop)
  return (
    <div className="p-6">
      {/* Header and URL Entry - Only show on standalone page */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Performance Analysis</h1>
        <p className="text-gray-600">Comprehensive website performance testing with Core Web Vitals</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <div className="relative">
                <input
                  id="url"
                  type="text"
                  placeholder="Enter your website URL (e.g., example.com)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-3 pr-12 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Zap className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
            
            <Button
              onClick={analyzeWebsite}
              disabled={loading}
              className="w-full bg-palette-primary hover:bg-palette-primary-hover text-white font-semibold py-3 px-8"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5" />
                  Analyze Performance
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="text-center py-8">
          <RefreshCw className="animate-spin h-12 w-12 text-palette-primary mx-auto mb-4" />
          <p className="text-slate-600">Analyzing performance for {url}...</p>
        </div>
      )}

      {error && (
        <div className="mb-8">
          <ErrorDisplay 
            error={error}
            onRetry={analyzeWebsite}
            onDismiss={clearError}
            isRetrying={isRetrying}
            variant="modal"
          />
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Half-height Header Strip */}
          <div className="bg-gradient-to-r from-palette-primary to-palette-primary-hover text-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-200">
                  <Globe className="h-5 w-5" />
                  <span className="text-lg font-medium">{data.url}</span>
                </div>
                <Button 
                  onClick={analyzeWebsite} 
                  disabled={loading}
                  variant="outline" 
                  className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3 hover:text-palette-primary"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Re-analyze
                </Button>
              </div>
              
              <div className="flex items-center gap-4 flex-wrap">
                <Badge className="bg-palette-accent-3 text-slate-700 border-0 px-3 py-1 text-sm">
                  {data.requests} requests
                </Badge>
                <Badge className="bg-palette-accent-3 text-slate-700 border-0 px-3 py-1 text-sm">
                  {(data.pageSize * 1024).toFixed(1)} KB total
                </Badge>
                <Badge className="bg-palette-accent-3 text-slate-700 border-0 px-3 py-1 text-sm">
                  {data.loadTime.toFixed(1)}s load time
                </Badge>
                <span className="text-purple-200 text-sm ml-auto">
                  Analyzed {new Date(data.timestamp).toLocaleDateString()} at {new Date(data.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {/* Main Performance Summary */}
          <div className="grid md:grid-cols-4 gap-6 mb-6">
            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Load Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{data.loadTime.toFixed(2)}s</div>
              </CardContent>
            </Card>
            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Page Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{data.pageSize.toFixed(2)} MB</div>
              </CardContent>
            </Card>
            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{data.requests}</div>
              </CardContent>
            </Card>
            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Performance Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-palette-primary">{data.performanceScore}</div>
              </CardContent>
            </Card>
          </div>

          {/* Core Web Vitals */}
          <Card className="mb-6 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Core Web Vitals</CardTitle>
              <CardDescription>Key metrics that measure real-world user experience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-foreground">Largest Contentful Paint (LCP)</span>
                    <span className={`text-xl font-bold ${data.coreWebVitals.lcp <= 2.5 ? "text-palette-primary" : "text-yellow-600"}`}>
                      {data.coreWebVitals.lcp.toFixed(2)}s
                    </span>
                  </div>
                  <Progress value={((2.5 - Math.min(data.coreWebVitals.lcp, 2.5)) / 2.5) * 100} className="h-2 bg-palette-accent-2 [&>div]:bg-palette-accent-1" />
                  <p className="text-xs text-muted-foreground">Good: ≤ 2.5s</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-foreground">First Input Delay (FID)</span>
                    <span className={`text-xl font-bold ${data.coreWebVitals.fid <= 100 ? "text-palette-primary" : "text-yellow-600"}`}>
                      {Math.round(data.coreWebVitals.fid)}ms
                    </span>
                  </div>
                  <Progress value={((100 - Math.min(data.coreWebVitals.fid, 100)) / 100) * 100} className="h-2 bg-palette-accent-2 [&>div]:bg-palette-accent-1" />
                  <p className="text-xs text-muted-foreground">Good: ≤ 100ms</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-foreground">Cumulative Layout Shift (CLS)</span>
                    <span className={`text-xl font-bold ${data.coreWebVitals.cls <= 0.1 ? "text-palette-primary" : "text-yellow-600"}`}>
                      {data.coreWebVitals.cls.toFixed(3)}
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
            <Card className="mb-6 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Lighthouse Scores</CardTitle>
                <CardDescription>Comprehensive performance analysis across multiple categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-foreground">Performance</span>
                      <span className={`text-xl font-bold ${data.performanceScore >= 90 ? "text-palette-primary" : data.performanceScore >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                        {data.performanceScore}
                      </span>
                    </div>
                    <Progress value={data.performanceScore} className="h-2 bg-palette-accent-2 [&>div]:bg-palette-accent-1" />
                    <p className="text-xs text-muted-foreground">Core performance metrics</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-foreground">Accessibility</span>
                      <span className={`text-xl font-bold ${data.lighthouseResults.accessibility >= 90 ? "text-palette-primary" : data.lighthouseResults.accessibility >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                        {data.lighthouseResults.accessibility}
                      </span>
                    </div>
                    <Progress value={data.lighthouseResults.accessibility} className="h-2 bg-palette-accent-2 [&>div]:bg-palette-accent-1" />
                    <p className="text-xs text-muted-foreground">WCAG compliance</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-foreground">Best Practices</span>
                      <span className={`text-xl font-bold ${data.lighthouseResults.bestPractices >= 90 ? "text-palette-primary" : data.lighthouseResults.bestPractices >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                        {data.lighthouseResults.bestPractices}
                      </span>
                    </div>
                    <Progress value={data.lighthouseResults.bestPractices} className="h-2 bg-palette-accent-2 [&>div]:bg-palette-accent-1" />
                    <p className="text-xs text-muted-foreground">Development standards</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-foreground">SEO</span>
                      <span className={`text-xl font-bold ${data.lighthouseResults.seo >= 90 ? "text-palette-primary" : data.lighthouseResults.seo >= 50 ? "text-yellow-600" : "text-red-600"}`}>
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

          {/* Performance Recommendations */}
          <Card className="mb-6 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
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

          {/* View Detailed Analysis Button */}
          <div className="flex justify-center">
            <Button 
              onClick={() => setShowDetailed(!showDetailed)}
              size="lg"
              className="bg-gradient-to-r from-palette-primary to-palette-primary-hover hover:from-purple-700 hover:to-palette-secondary text-white shadow-lg"
            >
              <Clock className="h-4 w-4 mr-2" />
              {showDetailed ? "Hide Detailed Analysis" : "View Detailed Analysis"}
            </Button>
          </div>

          {/* Detailed Analysis Tabs */}
          {showDetailed && !loadingDetails && detailedData && (
            <Tabs defaultValue="waterfall" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-palette-accent-3 border-palette-accent-2">
                <TabsTrigger value="waterfall" className="data-[state=active]:bg-palette-accent-1 data-[state=active]:text-white">
                  Waterfall Chart
                </TabsTrigger>
                <TabsTrigger value="resources" className="data-[state=active]:bg-palette-accent-1 data-[state=active]:text-white">
                  Resource Breakdown
                </TabsTrigger>
                <TabsTrigger value="timeline" className="data-[state=active]:bg-palette-accent-1 data-[state=active]:text-white">
                  Performance Timeline
                </TabsTrigger>
                <TabsTrigger value="ai-insights" className="data-[state=active]:bg-palette-accent-1 data-[state=active]:text-white">
                  AI Insights
                </TabsTrigger>
              </TabsList>

              <TabsContent value="waterfall" className="mt-6">
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-palette-primary">Resource Loading Waterfall</CardTitle>
                    <CardDescription>
                      Real-time timeline from Lighthouse showing when each resource was requested and loaded
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <WaterfallChart resources={detailedData.resources} timeline={detailedData.timeline} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resources" className="mt-6">
                <ResourceBreakdown resources={detailedData.resources} />
              </TabsContent>

              <TabsContent value="timeline" className="mt-6">
                <PerformanceTimeline timeline={detailedData.timeline} />
              </TabsContent>

              <TabsContent value="ai-insights" className="mt-6">
                <LLMFeedback url={detailedData.url} performanceData={detailedData} />
              </TabsContent>
            </Tabs>
          )}

          {showDetailed && loadingDetails && (
            <div className="text-center py-8">
              <RefreshCw className="animate-spin h-8 w-8 text-palette-primary mx-auto mb-2" />
              <p className="text-slate-600">Loading detailed analysis...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PerformanceMain;