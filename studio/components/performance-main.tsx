"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useTranslation, Trans } from "react-i18next"
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
  Activity,
  Sparkles,
  Monitor,
  Play,
  Eye,
  Target,
} from "lucide-react"
import Link from "next/link"
import { ErrorDisplay } from "@/components/error-display"
import { UrlInputForm } from "@/components/url-input-form"

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
  const { t } = useTranslation();
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
      text: t('performance.excellent'), 
      icon: CheckCircle,
      bgColor: "bg-green-500",
      textColor: "text-white"
    };
    if (score >= 70) return { 
      variant: "secondary" as const, 
      text: t('performance.good'), 
      icon: CheckCircle,
      bgColor: "bg-green-500",
      textColor: "text-white"
    };
    if (score >= 50) return { 
      variant: "default" as const, 
      text: t('performance.needsImprovement'), 
      icon: AlertTriangle,
      bgColor: "bg-orange-500",
      textColor: "text-white"
    };
    return { 
      variant: "destructive" as const, 
      text: t('performance.poor'), 
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
    toast({ title: t('performance.downloadComplete'), description: t('performance.reportDownloaded') });
  };

  const shareResultsLocal = async (data: AnalysisData) => {
    // Create a shareable summary
    const summary = t('performance.shareSummary', {
      url: data.url,
      score: data.performanceScore,
      loadTime: data.loadTime.toFixed(2),
      pageSize: data.pageSize.toFixed(2),
      requests: data.requests,
      lcp: data.coreWebVitals.lcp.toFixed(2),
      fid: data.coreWebVitals.fid.toFixed(0),
      cls: data.coreWebVitals.cls.toFixed(3),
      recommendations: data.recommendations.slice(0, 3).map(rec => `• ${rec}`).join('\n')
    });

    try {
      if (navigator.share) {
        // Use native sharing if available (mobile)
        await navigator.share({
          title: t('performance.reportTitle', { url: data.url }),
          text: summary,
          url: window.location.href
        });
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(summary);
        toast({ title: t('common.success'), description: t('performance.summaryCopied') });
      }
    } catch (error) {
      console.error('Error sharing results:', error);
      try {
        await navigator.clipboard.writeText(summary);
        toast({ title: t('common.success'), description: t('performance.summaryCopied') });
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
        toast({ title: t('common.error'), description: t('performance.shareFailed'), variant: "destructive" });
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
            <p className="text-slate-600">{t('performance.analyzingFor', { url: initialUrl })}</p>
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
                  {t('performance.reAnalyze')}
                </Button>
              </div>
              
              <div className="flex items-center gap-4 flex-wrap">
                <Badge className="bg-palette-accent-3 text-slate-700 border-0 px-3 py-1 text-sm">
                  {data.requests} {t('performance.requests')}
                </Badge>
                <Badge className="bg-palette-accent-3 text-slate-700 border-0 px-3 py-1 text-sm">
                  {(data.pageSize * 1024).toFixed(1)} KB {t('performance.total')}
                </Badge>
                <Badge className="bg-palette-accent-3 text-slate-700 border-0 px-3 py-1 text-sm">
                  {data.loadTime.toFixed(1)}s {t('performance.loadTime')}
                </Badge>
                <span className="text-purple-200 text-sm ml-auto">
                  {t('performance.analyzedAt', { date: new Date(data.timestamp).toLocaleDateString(), time: new Date(data.timestamp).toLocaleTimeString() })}
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
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section - Full hero with URL input */}
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
              <Zap className="h-4 w-4 mr-2" />
              {t('performance.title')}
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            {t('performance.testYourWebsite')}
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto mb-8 leading-relaxed">
            <Trans
              i18nKey="performance.heroDescription"
              components={[
                <span key="1" className="text-white font-semibold" />, // <1>
                <span key="3" className="text-white/90 font-semibold" />, // <3>
                <span key="5" className="text-white/95 font-semibold" /> // <5>
              ]}
            />
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              {t('performance.loadTime')}
            </div>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              {t('performance.pageSize')}
            </div>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              {t('performance.requests')}
            </div>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              {t('performance.coreWebVitals')}
            </div>
          </div>

          <div className="max-w-3xl mx-auto mb-12">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-8 border border-white/30 shadow-xl">
              <UrlInputForm />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
            <Button 
              onClick={analyzeWebsite}
              disabled={loading}
              size="lg" 
              className="bg-palette-primary hover:bg-palette-primary-hover text-white border-0 px-8 py-4 text-lg font-semibold rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  {t('performance.analyzing')}
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  {t('performance.analyzeNow')}
                </>
              )}
            </Button>
            <Button size="lg" className="bg-white/20 text-white border border-white/30 hover:bg-white/30 px-8 py-4 text-lg rounded-xl backdrop-blur-sm font-semibold">
              <Eye className="mr-2 h-5 w-5" />
              {t('performance.watchDemo')}
            </Button>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-8 text-white/80">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <span className="font-medium">{t('performance.noCreditCard')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <span className="font-medium">{t('performance.instantResults')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <span className="font-medium">{t('performance.enterpriseGrade')}</span>
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

      {/* Features Section - 3-Pack Feature List */}
      <section className="py-32 px-4 bg-gradient-to-br from-slate-50 to-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,rgba(120,119,198,0.1),transparent)]"></div>
        
        <div className="container mx-auto max-w-7xl relative z-10 px-4">
          <div className="text-center mb-20">
            <Badge variant="outline" className="mb-6 px-4 py-2 border-palette-accent-2 text-palette-primary">
              <Target className="h-4 w-4 mr-2" />
              {t('performance.professionalTools')}
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              {t('performance.everythingYouNeed')}
              <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-palette-primary to-palette-secondary bg-clip-text text-transparent">{t('performance.dominatePerformance')}</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              {t('performance.platformDescription')}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16 justify-items-center">
            {/* Feature 1 - Lightning Analysis */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-primary to-palette-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Activity className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">{t('performance.lightningAnalysis')}</h3>
                  <p className="text-slate-600 mb-4">
                    {t('performance.lightningAnalysisDesc')}
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('performance.subSecondAnalysis')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('performance.realLighthouseScores')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('performance.mobileDesktopTesting')}
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2 - AI-Powered Insights */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-primary to-palette-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">{t('performance.aiPoweredInsights')}</h3>
                  <p className="text-slate-600 mb-4">
                    {t('performance.aiPoweredInsightsDesc')}
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('performance.smartPriorityRanking')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('performance.codeLevelSuggestions')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('performance.impactPredictions')}
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Feature 3 - Visual Waterfalls */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-primary to-palette-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Monitor className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">{t('performance.visualWaterfalls')}</h3>
                  <p className="text-slate-600 mb-4">
                    {t('performance.visualWaterfallsDesc')}
                  </p>
                  
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('performance.resourceTimelineView')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('performance.bottleneckIdentification')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('performance.downloadShareReports')}
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Results Section - Show when there's data, loading, or error */}
      <div className="bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
        <div className="container mx-auto px-4 py-16 max-w-7xl">

      {loading && (
        <div className="text-center py-8">
          <RefreshCw className="animate-spin h-12 w-12 text-palette-primary mx-auto mb-4" />
          <p className="text-slate-600">{t('performance.analyzingFor', { url })}</p>
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
                  {t('performance.reAnalyze')}
                </Button>
              </div>
              
              <div className="flex items-center gap-4 flex-wrap">
                <Badge className="bg-palette-accent-3 text-slate-700 border-0 px-3 py-1 text-sm">
                  {data.requests} {t('performance.requests')}
                </Badge>
                <Badge className="bg-palette-accent-3 text-slate-700 border-0 px-3 py-1 text-sm">
                  {(data.pageSize * 1024).toFixed(1)} KB {t('performance.total')}
                </Badge>
                <Badge className="bg-palette-accent-3 text-slate-700 border-0 px-3 py-1 text-sm">
                  {data.loadTime.toFixed(1)}s {t('performance.loadTime')}
                </Badge>
                <span className="text-purple-200 text-sm ml-auto">
                  {t('performance.analyzedAt', { date: new Date(data.timestamp).toLocaleDateString(), time: new Date(data.timestamp).toLocaleTimeString() })}
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
      </div>
    </div>
  );
}

export default PerformanceMain;