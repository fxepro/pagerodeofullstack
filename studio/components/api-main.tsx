"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useTranslation, Trans } from "react-i18next"
import { useApiAnalysis } from "@/hooks/use-api-analysis"
import { ConsultationCTA } from "@/components/consultation-cta"
import { ErrorDisplay } from "@/components/error-display"
import { 
  Code, 
  Globe, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Activity, 
  Zap,
  Server,
  Wifi,
  Eye,
  Download,
  Share2,
  BarChart3
} from "lucide-react"

interface TestResult {
  endpoint: string
  status: number | null
  latency: number | null
  pass: boolean
  body?: any
  error?: string
}

interface ApiMainProps {
  url?: string;
}

export function ApiMain({ url: initialUrl = "" }: ApiMainProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const {
    domain,
    setDomain,
    customEndpoints,
    setCustomEndpoints,
    results,
    loading,
    discovered,
    statusMessage,
    setStatusMessage,
    runTests,
    clearAll,
    error,
    isRetrying,
    clearError,
  } = useApiAnalysis({ initialUrl, autoRun: !!initialUrl })

  // URL cleaning function
  const cleanUrl = (url: string): string => {
    if (!url) return "";
    
    // Remove protocol
    let cleaned = url.replace(/^https?:\/\//, '');
    
    // Remove www
    cleaned = cleaned.replace(/^www\./, '');
    
    // Remove trailing slash
    cleaned = cleaned.replace(/\/$/, '');
    
    // Add https:// back
    return `https://${cleaned}`;
  };

  // Auto-run handled in hook

  const commonApiPaths = [
    "/api/health",
    "/api/status", 
    "/api/hello",
    "/api/users",
    "/api/auth",
    "/api/ping",
    "/api/info"
  ]

  const crawlForApiEndpoints = async (domain: string) => {
    try {
      setStatusMessage("🔍 Crawling website for API links...")
      
      // Fetch the main page and look for API links
      const res = await fetch(domain, { 
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; API-Discovery-Bot/1.0)'
        }
      })
      if (!res.ok) {
        setStatusMessage("❌ Failed to crawl website")
        return []
      }
      
      setStatusMessage("📄 Parsing HTML for API endpoints...")
      const html = await res.text()
      
      // Extract all href attributes that contain /api/
      const hrefMatches = [...html.matchAll(/href=["']([^"']*\/api\/[^"']*)["']/gi)]
      const apiLinks = hrefMatches.map(m => {
        let url = m[1]
        // Convert relative URLs to absolute
        if (url.startsWith('/')) {
          url = domain.replace(/\/$/, "") + url
        } else if (!url.startsWith('http')) {
          url = domain.replace(/\/$/, "") + '/' + url
        }
        return url
      }).filter(url => url.includes('/api/'))
      
      const uniqueLinks = [...new Set(apiLinks)] // Remove duplicates
      if (uniqueLinks.length > 0) {
        setStatusMessage(`✅ Found ${uniqueLinks.length} API endpoints from crawling`)
      } else {
        setStatusMessage("⚠️ No API endpoints found in website links")
      }
      
      return uniqueLinks
    } catch (error) {
      console.warn('Crawling failed:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      setStatusMessage("❌ Crawling failed: " + errorMessage)
      return []
    }
  }

  const discoverEndpoints = async (domain: string) => {
    console.log("Custom endpoints:", customEndpoints) // Debug log
    
    // First, check if user provided custom endpoints (manual override)
    const manualList = customEndpoints
      .split(",")
      .map(ep => ep.trim())
      .filter(Boolean)
    
    console.log("Manual list:", manualList) // Debug log
    
    if (manualList.length > 0) {
      setStatusMessage(`📝 Using ${manualList.length} custom endpoints`)
      const customUrls = manualList.map(ep => {
        // Handle both relative and absolute URLs
        if (ep.startsWith('http')) {
          return ep // Already absolute
        } else if (ep.startsWith('/')) {
          return domain.replace(/\/$/, "") + ep // Relative to domain
        } else {
          return domain.replace(/\/$/, "") + '/' + ep // Relative path
        }
      })
      setStatusMessage(`✅ Found ${customUrls.length} custom endpoints to test`)
      return customUrls
    }

    // Automatic discovery process
    let discoveredEndpoints: string[] = []

    try {
      setStatusMessage("🗺️ Checking sitemap.xml...")
      const sitemapUrl = domain.replace(/\/$/, "") + "/sitemap.xml"
      const res = await fetch(sitemapUrl)
      if (res.ok) {
        setStatusMessage("📋 Parsing sitemap for API endpoints...")
        const xml = await res.text()
        const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1])
        const apiLinks = matches.filter(u => u.includes("/api/"))
        
        if (apiLinks.length > 0) {
          setStatusMessage(`✅ Found ${apiLinks.length} API endpoints in sitemap`)
          return apiLinks
        }
      }
      
      setStatusMessage("⚠️ No sitemap.xml or no /api/ endpoints, trying crawling...")
    } catch {
      setStatusMessage("⚠️ Sitemap failed, trying crawling...")
    }

    // Try crawling the main page
    const crawledEndpoints = await crawlForApiEndpoints(domain)
    if (crawledEndpoints.length > 0) {
      return crawledEndpoints
    }

    // Try common API patterns
    setStatusMessage("🔍 Trying common API endpoint patterns...")
    const commonPatterns = [
      "/api",
      "/api/",
      "/api/v1",
      "/api/v2", 
      "/api/users",
      "/api/posts",
      "/api/data",
      "/api/health",
      "/api/status",
      "/api/info",
      "/api/docs",
      "/api/swagger",
      "/posts",
      "/users",
      "/data",
      "/health",
      "/status"
    ]

    const testUrls = commonPatterns.map(pattern => domain.replace(/\/$/, "") + pattern)
    setStatusMessage(`🧪 Testing ${testUrls.length} common API patterns...`)

    // Test each pattern quickly to see if it exists
    const validEndpoints: string[] = []
    for (let i = 0; i < testUrls.length; i++) {
      const url = testUrls[i]
      setStatusMessage(`🔍 Testing pattern ${i + 1}/${testUrls.length}: ${url}`)
      try {
        const res = await fetch(url, { 
          method: 'HEAD', // Use HEAD to check if endpoint exists without downloading content
          signal: AbortSignal.timeout(3000)
        })
        // Only consider endpoints that return 200, 401, or 403 as valid (not 404)
        if (res.status === 200 || res.status === 401 || res.status === 403) {
          validEndpoints.push(url)
          console.log(`✅ Found endpoint: ${url} (status: ${res.status})`)
        } else {
          console.log(`❌ Endpoint not found: ${url} (status: ${res.status})`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.log(`❌ Endpoint not found: ${url} (error: ${errorMessage})`)
        // Endpoint doesn't exist or timed out
      }
    }

    if (validEndpoints.length > 0) {
      setStatusMessage(`✅ Found ${validEndpoints.length} real API endpoints using pattern matching`)
      return validEndpoints
    }

    setStatusMessage("❌ No API endpoints found via any discovery method")
    return []
  }

  // runTests provided by hook

  const exportResults = () => {
    const data = {
      domain,
      timestamp: new Date().toISOString(),
      discovered: discovered,
      results: results
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `api-test-results-${domain.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: t('api.resultsExported'),
      description: t('api.resultsExportedDesc'),
    })
  }

  const shareResults = async () => {
    const summary = `API Health Check Results for ${domain}:\n\n` +
      `✅ ${results.filter(r => r.pass).length}/${results.length} endpoints passed\n` +
      `📊 Average latency: ${(results.reduce((acc, r) => acc + (r.latency || 0), 0) / results.length).toFixed(0)}ms\n\n` +
      `Tested endpoints:\n${results.map(r => `• ${r.endpoint} - ${r.pass ? '✅' : '❌'} (${r.latency?.toFixed(0) || 'N/A'}ms)`).join('\n')}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `API Health Check - ${domain}`,
          text: summary,
        })
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(summary)
        toast({
          title: t('api.resultsCopied'),
          description: t('api.resultsCopiedDesc'),
        })
      }
      } else {
        navigator.clipboard.writeText(summary)
        toast({
          title: t('api.resultsCopied'), 
          description: t('api.resultsCopiedDesc'),
        })
      }
  }

  // When used in Site Audit (has initialUrl), show ONLY results
  if (initialUrl) {
    if (loading) {
      return (
        <div className="p-6">
          <div className="text-center py-8">
            <Activity className="animate-spin h-12 w-12 text-palette-primary mx-auto mb-4" />
            <p className="text-slate-600">{t('api.testingFor', { url: initialUrl })}</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-6">
          <ErrorDisplay 
            error={error}
            onRetry={runTests}
            onDismiss={clearError}
            isRetrying={isRetrying}
            variant="alert"
          />
        </div>
      );
    }

    if (results.length === 0) return null;

    const passedTests = results.filter(r => r.pass).length;
    const totalTests = results.length;
    const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    return (
      <div className="p-6">
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-palette-accent-2/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Code className="h-6 w-6 text-palette-primary" />
                  {t('api.apiHealthCheckResults')}
                </h2>
                <p className="text-slate-600 mt-1">
                  {t('api.endpointsPassed', { passed: passedTests, total: totalTests, rate: successRate })}
                </p>
              </div>
              <Button
                onClick={runTests}
                disabled={loading}
                variant="outline"
                className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
              >
                <Activity className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {t('api.retest')}
              </Button>
            </div>
          </div>

          {/* Discovery Status */}
          {statusMessage && (
            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-palette-primary" />
                  <div>
                    <h3 className="font-semibold text-slate-800">{t('api.discoveryStatus')}</h3>
                    <p className="text-slate-600 text-sm">{statusMessage}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Summary */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-slate-800">{passedTests}</div>
                <div className="text-sm text-slate-600">{t('api.passedTests')}</div>
              </CardContent>
            </Card>

            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mx-auto mb-4">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-slate-800">{totalTests - passedTests}</div>
                <div className="text-sm text-slate-600">{t('api.failedTests')}</div>
              </CardContent>
            </Card>

            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-800">{successRate}%</div>
                <div className="text-sm text-slate-600">{t('api.successRate')}</div>
              </CardContent>
            </Card>

            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-palette-accent-3 rounded-lg mx-auto mb-4">
                  <Globe className="h-6 w-6 text-palette-primary" />
                </div>
                <div className="text-2xl font-bold text-slate-800">{discovered.length}</div>
                <div className="text-sm text-slate-600">{t('api.endpointsFound')}</div>
              </CardContent>
            </Card>
          </div>

          {/* API Test Results */}
          <Card className="border-palette-accent-2/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Server className="h-5 w-5 text-palette-primary" />
                {t('api.apiEndpointTestResults')}
              </CardTitle>
              <CardDescription className="text-slate-600">
                {t('api.detailedResultsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    result.pass 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {result.pass ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <code className="text-sm font-mono text-slate-800 bg-white px-2 py-1 rounded border">
                          {result.endpoint}
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.status && (
                          <Badge className={`text-xs ${
                            result.status >= 200 && result.status < 300 
                              ? 'bg-green-100 text-green-800' 
                              : result.status >= 400 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {result.status}
                          </Badge>
                        )}
                        {result.latency && (
                          <Badge variant="outline" className="text-xs">
                            {result.latency}ms
                          </Badge>
                        )}
                      </div>
                    </div>
                    {result.error && (
                      <div className="text-sm text-red-600 mt-2">
                        {t('api.error')}: {result.error}
                      </div>
                    )}
                    {result.body && (
                      <details className="mt-2">
                        <summary className="text-sm text-slate-600 cursor-pointer hover:text-slate-800">
                          {t('api.viewResponseBody')}
                        </summary>
                        <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                          {JSON.stringify(result.body, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Discovered Endpoints */}
          {discovered.length > 0 && (
            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-palette-primary" />
                  {t('api.discoveredApiEndpoints')}
                </CardTitle>
                <CardDescription className="text-slate-600">
                  {t('api.endpointsFoundCrawling')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {discovered.map((endpoint, index) => (
                    <div key={index} className="p-3 bg-slate-50 rounded-lg border">
                      <code className="text-sm font-mono text-slate-700">{endpoint}</code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      {!initialUrl && (
      <section className="relative min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-palette-accent-2 via-palette-accent-1 to-palette-primary">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-10 opacity-35">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-palette-primary-hover rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-800 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse animation-delay-2000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-palette-primary rounded-full mix-blend-multiply filter blur-2xl opacity-55 animate-pulse animation-delay-4000"></div>
          </div>
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="mb-6">
            <Badge variant="outline" className="border-white/40 text-white bg-white/15 backdrop-blur-sm px-6 py-2 text-sm font-medium shadow-lg">
              <Code className="h-4 w-4 mr-2" />
              {t('api.heroBadge')}
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('api.heroTitle')}
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto mb-8 leading-relaxed">
            <Trans
              i18nKey="api.heroDescription"
              components={{
                1: <span className="text-white font-semibold" />,
                3: <span className="text-purple-100 font-semibold" />,
                5: <span className="text-purple-50 font-semibold" />,
              }}
            />
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              {t('api.sitemapDiscovery')}
            </div>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              {t('api.statusCodes')}
            </div>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              {t('api.responseTimes')}
            </div>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              {t('api.errorAnalysis')}
            </div>
          </div>

          {/* Input Section */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-8 border border-white/30 shadow-xl">
              <div className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder={t('api.urlPlaceholder')}
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="h-14 text-lg px-4 bg-white/90 border-0 rounded-xl placeholder:text-gray-500 focus:ring-2 focus:ring-white/50"
                    disabled={loading}
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    placeholder={t('api.customEndpointsPlaceholder')}
                    value={customEndpoints}
                    onChange={(e) => setCustomEndpoints(e.target.value)}
                    className="h-12 text-base px-4 bg-white/90 border-0 rounded-xl placeholder:text-gray-500 focus:ring-2 focus:ring-white/50"
                    disabled={loading}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={runTests}
                    disabled={loading}
                    className="bg-gradient-to-r from-palette-primary to-palette-primary-hover hover:from-purple-700 hover:to-palette-secondary text-white px-8 py-3 h-14 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center"
                  >
                    {loading ? (
                      <>
                        <Activity className="mr-2 h-5 w-5 animate-spin" />
                        {t('api.testingApis')}
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-5 w-5" />
                        {t('api.runApiTests')}
                      </>
                    )}
                  </Button>
                  
                  {(results.length > 0 || statusMessage) && (
                  <Button 
                    onClick={clearAll}
                      variant="outline"
                      className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3 px-6 py-3 h-14 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center"
                    >
                      <XCircle className="mr-2 h-5 w-5" />
                      {t('api.clearResults')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Error Display Section - Show on standalone page */}
      {!initialUrl && error && (
        <div className="bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3 py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <ErrorDisplay 
              error={error}
              onRetry={runTests}
              onDismiss={clearError}
              isRetrying={isRetrying}
              variant="modal"
            />
          </div>
        </div>
      )}

      {/* Discovery Status Message - Centered Above Feature Cards */}
      {!initialUrl && statusMessage && (
        <div className="bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3 py-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card className="border-blue-200/50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-3">
                  <div className="text-3xl">🔍</div>
                  <div className="text-center">
                    <h3 className="font-semibold text-slate-800 text-lg">{t('api.discoveryStatus')}</h3>
                    <p className="text-sm text-blue-700 mt-1">{statusMessage}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Feature Boxes */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 justify-items-center">
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">{t('api.autoDiscovery')}</h3>
                  <p className="text-slate-600 mb-4">
                    {t('api.autoDiscoveryDesc')}
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('api.sitemapParsing')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('api.webCrawling')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('api.patternMatching')}
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">{t('api.realtimeTesting')}</h3>
                  <p className="text-slate-600 mb-4">
                    {t('api.realtimeTestingDesc')}
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('api.liveHttpRequests')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('api.responseTimeTracking')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('api.dataIntegrityChecks')}
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">{t('api.detailedAnalytics')}</h3>
                  <p className="text-slate-600 mb-4">
                    {t('api.detailedAnalyticsDesc')}
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('api.latencyMetrics')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('api.successRateAnalysis')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('api.responseBodyInspection')}
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Results Section - Only show when there's content */}
      {(discovered.length > 0 || results.length > 0) && (
        <div className="bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
          <div className="container mx-auto px-4 py-4">
            
            {/* Discovered Endpoints Info */}
            {discovered.length > 0 && (
            <div className="mb-8 max-w-2xl mx-auto">
              <Card className="border-palette-accent-2/50 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-3">
                    <Globe className="h-6 w-6 text-palette-primary" />
                    <div className="text-center">
                      <h3 className="font-semibold text-slate-800">{t('api.discoveredEndpoints')}</h3>
                      <p className="text-sm text-slate-600">{t('api.testingEndpoints', { count: discovered.length })}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results Table */}
          {results.length > 0 && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid md:grid-cols-4 gap-6">
                <Card className="border-green-200/50 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {results.filter(r => r.pass).length}
                    </div>
                    <p className="text-sm text-slate-600">{t('api.passed')}</p>
                  </CardContent>
                </Card>

                <Card className="border-red-200/50 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {results.filter(r => !r.pass).length}
                    </div>
                    <p className="text-sm text-slate-600">{t('api.failed')}</p>
                  </CardContent>
                </Card>

                <Card className="border-blue-200/50 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {results.length > 0 ? Math.round(results.reduce((acc, r) => acc + (r.latency || 0), 0) / results.length) : 0}ms
                    </div>
                    <p className="text-sm text-slate-600">{t('api.avgLatency')}</p>
                  </CardContent>
                </Card>

                <Card className="border-palette-accent-2/50 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Server className="h-8 w-8 text-palette-primary" />
                    </div>
                    <div className="text-2xl font-bold text-palette-primary">
                      {results.length}
                    </div>
                    <p className="text-sm text-slate-600">{t('api.totalEndpoints')}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={exportResults}
                  className="bg-white text-palette-primary border border-palette-accent-2 hover:bg-palette-accent-3 px-6 py-3"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t('api.exportResults')}
                </Button>
                <Button 
                  onClick={shareResults}
                  className="bg-white text-palette-primary border border-palette-accent-2 hover:bg-palette-accent-3 px-6 py-3"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  {t('api.shareSummary')}
                </Button>
              </div>

              {/* Detailed Results Table */}
              <Card className="border-palette-accent-2/50 shadow-xl overflow-hidden">
                <CardHeader className="bg-white py-6">
                  <CardTitle className="flex items-center justify-center gap-2 text-xl text-slate-800">
                    <Code className="h-6 w-6" />
                    {t('api.apiTestResults')}
                  </CardTitle>
                  <CardDescription className="text-slate-600 mt-2 text-center">
                    {t('api.detailedAnalysisDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left p-3 font-semibold text-slate-700 border-b border-slate-200">{t('api.endpoint')}</th>
                          <th className="text-center p-3 font-semibold text-slate-700 border-b border-slate-200">{t('api.code')}</th>
                          <th className="text-center p-3 font-semibold text-slate-700 border-b border-slate-200">{t('api.status')}</th>
                          <th className="text-center p-3 font-semibold text-slate-700 border-b border-slate-200">{t('api.latency')}</th>
                          <th className="text-left p-3 font-semibold text-slate-700 border-b border-slate-200">{t('api.responseError')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((result, index) => (
                          <tr 
                            key={index} 
                            className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${
                              result.pass ? 'bg-green-50/30' : 'bg-red-50/30'
                            }`}
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-slate-500" />
                                <span className="font-medium text-slate-800 text-sm">
                                  {result.endpoint}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <Badge 
                                variant={result.status ? "default" : "destructive"}
                                className={result.status === 200 ? "bg-green-100 text-green-800" : 
                                          result.status && result.status >= 400 ? "bg-red-100 text-red-800" :
                                          "bg-yellow-100 text-yellow-800"}
                              >
                                {result.status ?? "ERR"}
                              </Badge>
                            </td>
                            <td className="p-3 text-center">
                              {result.pass ? (
                                <div className="flex items-center justify-center gap-1">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span className="text-green-700 font-medium text-sm">{t('api.success')}</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  <XCircle className="h-4 w-4 text-red-600" />
                                  <span className="text-red-700 font-medium text-sm">{t('api.failed')}</span>
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Clock className="h-3 w-3 text-slate-500" />
                                <span className="font-medium text-slate-700">
                                  {result.latency ? `${result.latency.toFixed(0)}ms` : "-"}
                                </span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="max-w-md">
                                {result.body ? (
                                  <pre className="text-xs bg-white border rounded p-2 overflow-x-auto max-h-32 text-slate-700">
                                    {JSON.stringify(result.body, null, 2)}
                                  </pre>
                                ) : result.error ? (
                                  <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
                                    {result.error}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-500">{t('api.noResponseBody')}</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          </div>

          {/* Call to Action Section - Only show after results */}
          {(results.length > 0 || statusMessage) && (
            <ConsultationCTA
              title={t('api.ctaTitle')}
              description={t('api.ctaDescription')}
              secondaryButtonHref="/api-info"
            />
          )}
        </div>
      )}
    </div>
  )
}
