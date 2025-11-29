"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Database, 
  ExternalLink, 
  Link2, 
  RefreshCw, 
  Wifi 
} from "lucide-react"

interface MonitorReportProps {
  url: string
  minimal?: boolean
}

interface MonitorResult {
  url: string
  status: "up" | "down" | "checking"
  responseTime: number
  timestamp: string
  statusCode?: number
  ssl?: {
    valid: boolean
    expiresIn: number
    issuer?: string
  }
  headers?: {
    server?: string
    contentType?: string
  }
  error?: string
}

interface LinkResult {
  url: string
  statusCode: number
  responseTime: number
  status: "success" | "error" | "redirect"
  error?: string
  isInternal: boolean
}

interface LinkTestResult {
  baseUrl: string
  totalLinks: number
  testedLinks: number
  results: LinkResult[]
  summary: {
    success: number
    errors: number
    redirects: number
    avgResponseTime: number
  }
}

export function MonitorReport({ url, minimal = false }: MonitorReportProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [monitorResult, setMonitorResult] = useState<MonitorResult | null>(null)
  const [lastChecked, setLastChecked] = useState<string>("")
  const [isTestingLinks, setIsTestingLinks] = useState(false)
  const [linkResults, setLinkResults] = useState<LinkTestResult | null>(null)
  const [linksPage, setLinksPage] = useState(1)

  // Ensure URL has protocol for parsing
  const fullUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`
  const domain = new URL(fullUrl).hostname
  const protocol = new URL(fullUrl).protocol.replace(":", "").toUpperCase()

  const handleCheck = async () => {
    setIsChecking(true)

    try {
      const response = await fetch("/api/monitor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      const result = await response.json()
      setMonitorResult(result)
      setLastChecked(new Date().toLocaleString())
    } catch (error) {
      console.error("Monitor check failed:", error)
      setMonitorResult({
        url,
        status: "down",
        responseTime: 0,
        timestamp: new Date().toISOString(),
        error: "Failed to check website",
      })
    } finally {
      setIsChecking(false)
    }
  }

  const handleTestLinks = async () => {
    setIsTestingLinks(true)

    try {
      // Ensure URL has protocol
      const urlToTest = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`
      
      const response = await fetch("/api/monitor/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: urlToTest,
          includeExternal: false,
          maxLinks: 25,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
        throw new Error(errorData.error || errorData.message || "Link testing failed")
      }

      const result = await response.json()
      setLinkResults(result)
    } catch (error) {
      console.error("Link testing failed:", error)
      // Set error state so user can see what went wrong
      setLinkResults({
        baseUrl: url,
        totalLinks: 0,
        testedLinks: 0,
        results: [],
        summary: {
          success: 0,
          errors: 1,
          redirects: 0,
          avgResponseTime: 0
        }
      })
    } finally {
      setIsTestingLinks(false)
    }
  }

  const getStatusColor = () => {
    if (isChecking) return "bg-yellow-500"
    if (!monitorResult) return "bg-gray-500"
    return monitorResult.status === "up" ? "bg-green-500" : "bg-red-500"
  }

  const getStatusText = () => {
    if (isChecking) return "Checking..."
    if (!monitorResult) return "Unknown"
    return monitorResult.status === "up" ? "Online" : "Offline"
  }

  const getResponseTimeColor = () => {
    if (!monitorResult?.responseTime) return "text-slate-600"
    if (monitorResult.responseTime < 500) return "text-green-600"
    if (monitorResult.responseTime < 1000) return "text-yellow-600"
    return "text-red-600"
  }

  useEffect(() => {
    // Automatically check when component loads and run link testing
    const runInitialChecks = async () => {
      await handleCheck()
      await handleTestLinks()
    }
    runInitialChecks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  useEffect(() => {
    setLinksPage(1)
  }, [linkResults?.baseUrl])

  const detailContent = (
    <div className="space-y-6">
          {/* Half-height Header Strip */}
          {monitorResult && (
            <div className="bg-gradient-to-r from-palette-primary to-palette-primary-hover text-white rounded-lg shadow-lg p-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-200">
                    <Activity className="h-5 w-5" />
                    <span className="text-lg font-medium">{domain}</span>
                  </div>
                  <Button 
                    onClick={handleCheck} 
                    disabled={isChecking}
                    variant="outline" 
                    className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3 hover:text-palette-primary"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                    Re-check
                  </Button>
                </div>
                
                <div className="flex items-center gap-4 flex-wrap">
                  <Badge className="bg-palette-accent-3 text-slate-700 border-0 px-3 py-1 text-sm flex items-center gap-1">
                    {monitorResult.status === 'up' ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-red-600" />
                    )}
                    Status: {monitorResult.status === 'up' ? 'Online' : 'Offline'}
                  </Badge>
                  <Badge className="bg-palette-accent-3 text-slate-700 border-0 px-3 py-1 text-sm">
                    {monitorResult.responseTime}ms response
                  </Badge>
                  <Badge className="bg-palette-accent-3 text-slate-700 border-0 px-3 py-1 text-sm">
                    {monitorResult.statusCode || '—'} status code
                  </Badge>
                  {monitorResult.ssl && (
                    <Badge className="bg-palette-accent-3 text-slate-700 border-0 px-3 py-1 text-sm">
                      SSL {monitorResult.ssl.valid ? 'Valid' : 'Invalid'}
                    </Badge>
                  )}
                  <span className="text-purple-200 text-sm ml-auto">
                    Checked {lastChecked}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Technical Details Section */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Server Info */}
            <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/10 transition-all duration-300 bg-white">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <Database className="h-5 w-5 text-palette-primary" />
                  Server Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">Server:</span>
                  <span className="text-slate-700 font-medium">
                    {monitorResult?.headers?.server || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Content Type:</span>
                  <span className="text-slate-700 font-medium">
                    {monitorResult?.headers?.contentType || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Protocol:</span>
                  <span className="text-slate-700 font-medium">{protocol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Domain:</span>
                  <span className="text-slate-700 font-medium">{domain}</span>
                </div>
              </CardContent>
            </Card>

            {/* Connection Info */}
            <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/10 transition-all duration-300 bg-white">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-palette-primary" />
                  Connection Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">Response Time:</span>
                  <span className={`font-semibold ${getResponseTimeColor()}`}>
                    {monitorResult?.responseTime ? `${monitorResult.responseTime}ms` : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Status Code:</span>
                  <span className="text-slate-700 font-medium">
                    {monitorResult?.statusCode || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">SSL Issuer:</span>
                  <span className="text-slate-700 font-medium">
                    {monitorResult?.ssl?.issuer || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Check Time:</span>
                  <span className="text-slate-700 font-medium">{lastChecked || "—"}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Summary */}
          <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/10 transition-all duration-300 bg-white">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Activity className="h-5 w-5 text-palette-primary" />
                Status Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monitorResult?.error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
                      <AlertTriangle className="h-5 w-5" />
                      Error Detected
                    </div>
                    <p className="text-red-600">{monitorResult.error}</p>
                  </div>
                )}

                {monitorResult?.status === "up" && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                      <CheckCircle className="h-5 w-5" />
                      Website is Online
                    </div>
                    <p className="text-green-600">
                      The website is accessible and responding normally with a{" "}
                      {monitorResult.responseTime}ms response time.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-palette-accent-3 border border-palette-accent-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ExternalLink className="h-5 w-5 text-palette-primary" />
                    <div>
                      <p className="font-medium text-slate-800">Visit Website</p>
                      <p className="text-sm text-slate-600">Open {domain} in a new tab</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-palette-primary hover:text-palette-primary hover:bg-palette-accent-3"
                  >
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      Visit
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* All Page Links Test Results */}
          <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/10 transition-all duration-300 bg-white">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Link2 className="h-5 w-5 text-palette-primary" />
                All Page Links Test Results
                {isTestingLinks && (
                  <RefreshCw className="h-4 w-4 text-palette-primary animate-spin ml-2" />
                )}
              </CardTitle>
              <CardDescription className="text-slate-600">
                {isTestingLinks
                  ? "Scanning homepage and testing all internal links..."
                  : linkResults
                  ? `Found and tested ${linkResults.totalLinks} links from the homepage`
                  : "Loading link test results..."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isTestingLinks ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 text-palette-primary animate-spin mx-auto mb-3" />
                  <p className="text-slate-600">Testing all links on the homepage...</p>
                  <p className="text-sm text-slate-500 mt-1">This may take a few moments</p>
                </div>
              ) : linkResults ? (
                <>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {linkResults.summary.success}
                  </div>
                  <div className="text-sm text-green-600">Success (2xx)</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-700">
                    {linkResults.summary.redirects}
                  </div>
                  <div className="text-sm text-yellow-600">Redirects (3xx)</div>
                </div>
                <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">
                    {linkResults.summary.errors}
                  </div>
                  <div className="text-sm text-red-600">Errors (4xx/5xx)</div>
                </div>
                <div className="text-center p-3 bg-palette-accent-3 border border-palette-accent-2 rounded-lg">
                  <div className="text-2xl font-bold text-palette-primary">
                    {linkResults.summary.avgResponseTime}ms
                  </div>
                  <div className="text-sm text-palette-primary">Avg Response</div>
                </div>
              </div>

              {/* Detailed Results */}
                {(() => {
                  const linksPerPage = 100
                  const allLinks = linkResults.results
                  const totalPages = Math.ceil(allLinks.length / linksPerPage)
                  const currentPage = Math.min(linksPage, Math.max(totalPages, 1))
                  const pageStart = (currentPage - 1) * linksPerPage
                  const pageEnd = totalPages > 1 ? pageStart + linksPerPage : allLinks.length
                  const paginatedLinks = totalPages > 1 ? allLinks.slice(pageStart, pageEnd) : allLinks

                  return (
                    <>
                      <div className="space-y-3">
                        {paginatedLinks.map((link, index) => {
                  const getStatusColor = (statusCode: number) => {
                    if (statusCode >= 200 && statusCode < 300)
                      return "text-green-600 bg-green-50 border-green-200"
                    if (statusCode >= 300 && statusCode < 400)
                      return "text-yellow-600 bg-yellow-50 border-yellow-200"
                    if (statusCode >= 400)
                      return "text-red-600 bg-red-50 border-red-200"
                    return "text-gray-600 bg-gray-50 border-gray-200"
                  }

                  const getStatusIcon = (status: string) => {
                    if (status === "success")
                      return <CheckCircle className="h-4 w-4 text-green-600" />
                    if (status === "redirect")
                      return <RefreshCw className="h-4 w-4 text-yellow-600" />
                    return <AlertTriangle className="h-4 w-4 text-red-600" />
                  }

                  return (
                    <div
                              key={`${currentPage}-${index}-${link.url}`}
                      className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getStatusIcon(link.status)}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-800 truncate">
                            {link.url
                              .replace(linkResults.baseUrl, "")
                              .replace(/^\/$/, "/homepage") || "/homepage"}
                          </div>
                          <div className="text-sm text-slate-500 truncate">
                            {link.url}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded border ${getStatusColor(
                            link.statusCode
                          )}`}
                        >
                          {link.statusCode || "ERR"}
                        </span>
                        <span className="text-sm text-slate-600 w-16 text-right">
                          {link.responseTime}ms
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="text-palette-primary hover:text-palette-primary hover:bg-palette-accent-3 h-8 w-8 p-0"
                        >
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  )
                        })}
                      </div>

                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <div className="text-sm text-slate-600">
                            Showing {pageStart + 1}-{Math.min(pageEnd, allLinks.length)} of {allLinks.length} links
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setLinksPage(1)}
                              disabled={currentPage === 1}
                              className="border-palette-accent-2"
                            >
                              First
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setLinksPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                              className="border-palette-accent-2"
                            >
                              Previous
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setLinksPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                              className="border-palette-accent-2"
                            >
                              Next
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setLinksPage(totalPages)}
                              disabled={currentPage === totalPages}
                              className="border-palette-accent-2"
                            >
                              Last
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}

                  {linkResults.results.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <Link2 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                      <p>No links found on the homepage</p>
                    </div>
                      )}
                </>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Link2 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>Loading link test results...</p>
                </div>
              )}
            </CardContent>
          </Card>
    </div>
  )

  if (minimal) {
    return detailContent
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3 py-16">
      <div className="container mx-auto px-4 max-w-7xl">
        {detailContent}
      </div>
    </div>
  )
}
