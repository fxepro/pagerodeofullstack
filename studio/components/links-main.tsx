"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation, Trans } from "react-i18next"
import { 
  Link2, 
  Globe, 
  Zap, 
  BarChart3, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  ExternalLink,
  Search,
  RefreshCw,
  Eye,
  FileText,
  Activity
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useLinksAnalysis } from "@/hooks/use-links-analysis"
import { ConsultationCTA } from "@/components/consultation-cta"
import { ErrorDisplay } from "@/components/error-display"

interface LinkResult {
  url: string
  status: number
  statusText: string
  responseTime: number
  error?: string
  isInternal: boolean
  linkText?: string
}

interface LinksMainProps {
  url?: string;
}

export function LinksMain({ url: initialUrl = "" }: LinksMainProps) {
  const { t } = useTranslation()
  const {
    domain,
    setDomain,
    loading,
    results,
    statusMessage,
    discoveredLinks,
    runLinkCheck,
    clearResults,
    error,
    isRetrying,
    clearError,
  } = useLinksAnalysis({ initialUrl, autoRun: !!initialUrl })

  const getStatusColor = (status: number) => {
    if (status === 0) return "text-red-600 bg-red-50"
    if (status >= 200 && status < 300) return "text-green-600 bg-green-50"
    if (status >= 300 && status < 400) return "text-blue-600 bg-blue-50"
    if (status >= 400) return "text-red-600 bg-red-50"
    return "text-gray-600 bg-gray-50"
  }

  const getStatusIcon = (status: number) => {
    if (status === 0) return <XCircle className="h-4 w-4" />
    if (status >= 200 && status < 300) return <CheckCircle className="h-4 w-4" />
    if (status >= 300 && status < 400) return <ExternalLink className="h-4 w-4" />
    if (status >= 400) return <XCircle className="h-4 w-4" />
    return <AlertTriangle className="h-4 w-4" />
  }

  // When used in Site Audit (has initialUrl), show ONLY results
  if (initialUrl) {
    if (loading) {
      return (
        <div className="p-6">
          <div className="text-center py-8">
            <RefreshCw className="animate-spin h-12 w-12 text-palette-primary mx-auto mb-4" />
            <p className="text-slate-600">{t('links.checkingFor', { url: initialUrl })}</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-6">
          <ErrorDisplay 
            error={error}
            onRetry={runLinkCheck}
            onDismiss={clearError}
            isRetrying={isRetrying}
            variant="alert"
          />
        </div>
      );
    }

    if (results.length === 0 && !statusMessage) return null;

    return (
      <div className="p-6">
        <div className="space-y-6">
          {/* Header */}
          {results.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 border border-palette-accent-2/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Link2 className="h-6 w-6 text-palette-primary" />
                    {t('links.linkAnalysisFor', { domain: initialUrl })}
                  </h2>
                  <p className="text-slate-600 mt-1">
                    {t('links.foundLinksChecked', { discovered: discoveredLinks.length, checked: results.length })}
                  </p>
                </div>
                <Button
                  onClick={runLinkCheck}
                  disabled={loading}
                  variant="outline"
                  className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {t('links.recheck')}
                </Button>
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-800 font-medium">{statusMessage}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Stats */}
          {results.length > 0 && (
            <>
              <div className="grid md:grid-cols-4 gap-4">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {results.filter(r => r.status >= 200 && r.status < 400).length}
                    </div>
                    <div className="text-sm text-green-700">{t('links.workingLinks')}</div>
                  </CardContent>
                </Card>
                
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {results.filter(r => r.status >= 400 || r.status === 0).length}
                    </div>
                    <div className="text-sm text-red-700">{t('links.brokenLinks')}</div>
                  </CardContent>
                </Card>
                
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {results.filter(r => r.isInternal).length}
                    </div>
                    <div className="text-sm text-blue-700">{t('links.internalLinks')}</div>
                  </CardContent>
                </Card>
                
                <Card className="border-palette-accent-2 bg-palette-accent-3">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-palette-primary">
                      {results.filter(r => !r.isInternal).length}
                    </div>
                    <div className="text-sm text-palette-primary">{t('links.externalLinks')}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Links Table */}
              <Card className="border-palette-accent-2/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-palette-primary" />
                    {t('links.allLinks', { count: results.length })}
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    {t('links.completeListDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0 mr-4">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon(result.status)}
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-palette-primary hover:text-palette-primary hover:underline truncate"
                            >
                              {result.url}
                            </a>
                          </div>
                          {result.linkText && (
                            <p className="text-xs text-slate-500 truncate ml-6">
                              {result.linkText}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <Badge className={`${getStatusColor(result.status)} px-2 py-1`}>
                            {result.status === 0 ? t('links.error') : result.status}
                          </Badge>
                          <Badge variant="outline" className="px-2 py-1">
                            {result.isInternal ? t('links.internal') : t('links.external')}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {result.responseTime}ms
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-palette-accent-2 via-palette-accent-1 to-palette-primary">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-10 opacity-35">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-palette-primary-hover rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-800 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse animation-delay-2000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-palette-primary rounded-full mix-blend-multiply filter blur-2xl opacity-55 animate-pulse animation-delay-4000"></div>
          </div>
        </div>
        
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="mb-8">
            <Badge variant="outline" className="border-white/40 text-white bg-white/15 backdrop-blur-sm px-6 py-2 text-sm font-medium shadow-lg">
              <Link2 className="h-4 w-4 mr-2" />
              {t('links.heroBadge')}
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            {t('links.heroTitle')}
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto mb-8 leading-relaxed">
            <Trans
              i18nKey="links.heroDescription"
              components={{
                1: <span className="text-white font-semibold" />,
              }}
            />
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              {t('links.autoDiscovery')}
            </div>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              {t('links.statusChecking')}
            </div>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              {t('links.performanceMetrics')}
            </div>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              {t('links.detailedReports')}
            </div>
          </div>

          {/* Input Form in Hero Section */}
          <div className="max-w-2xl mx-auto">
            <Card className="border-white/20 bg-white/10 backdrop-blur-sm shadow-xl">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="domain" className="text-white font-medium">{t('links.websiteUrl')}</Label>
                    <Input
                      id="domain"
                      type="text"
                      placeholder={t('links.urlPlaceholder')}
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="border-white/30 bg-white/20 text-white placeholder:text-white/70 focus:border-white/50 focus:ring-white/50"
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      onClick={runLinkCheck}
                      disabled={loading || !domain.trim()}
                      className="bg-white text-palette-primary hover:bg-palette-accent-3 px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                          {t('links.checkingLinks')}
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-5 w-5" />
                          {t('links.checkLinks')}
                        </>
                      )}
                    </Button>
                    
                    {(results.length > 0 || statusMessage) && (
                      <Button 
                        onClick={clearResults}
                        variant="outline"
                        className="border-white/40 text-white hover:bg-white/10 px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <RefreshCw className="mr-2 h-5 w-5" />
                        {t('links.clearResults')}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Error Display Section - Show on standalone page */}
      {!initialUrl && error && (
        <div className="bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3 py-16">
          <div className="container mx-auto px-4 max-w-7xl">
            <ErrorDisplay 
              error={error}
              onRetry={runLinkCheck}
              onDismiss={clearError}
              isRetrying={isRetrying}
              variant="modal"
            />
          </div>
        </div>
      )}

      {/* Feature Boxes */}
      <section className="py-6 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-6 mb-4">
            <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-palette-accent-3 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-palette-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{t('links.autoDiscoveryTitle')}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {t('links.autoDiscoveryDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-palette-accent-3 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-palette-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{t('links.statusValidationTitle')}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {t('links.statusValidationDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-palette-accent-3 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-palette-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{t('links.detailedAnalyticsTitle')}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {t('links.detailedAnalyticsDesc')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* Results Section */}
      {(results.length > 0 || statusMessage) && (
        <section className="py-4 px-4 bg-white">
          <div className="container mx-auto max-w-7xl">
            {/* Header */}
            {results.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6 border border-palette-accent-2/50 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                      <Link2 className="h-6 w-6 text-palette-primary" />
                      {t('links.linkAnalysisFor', { domain })}
                    </h2>
                    <p className="text-slate-600 mt-1">
                      {t('links.foundLinksChecked', { discovered: discoveredLinks.length, checked: results.length })}
                    </p>
                  </div>
                  <Button
                    onClick={runLinkCheck}
                    disabled={loading}
                    variant="outline"
                    className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {t('links.recheck')}
                  </Button>
                </div>
              </div>
            )}

            {/* Status Message */}
            {statusMessage && (
              <Card className="mb-6 border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <span className="text-blue-800 font-medium">{statusMessage}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary Stats */}
            {results.length > 0 && (
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {results.filter(r => r.status >= 200 && r.status < 400).length}
                    </div>
                    <div className="text-sm text-green-700">{t('links.workingLinks')}</div>
                  </CardContent>
                </Card>
                
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {results.filter(r => r.status >= 400 || r.status === 0).length}
                    </div>
                    <div className="text-sm text-red-700">{t('links.brokenLinks')}</div>
                  </CardContent>
                </Card>
                
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {results.filter(r => r.isInternal).length}
                    </div>
                    <div className="text-sm text-blue-700">{t('links.internalLinks')}</div>
                  </CardContent>
                </Card>
                
                <Card className="border-palette-accent-2 bg-palette-accent-3">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-palette-primary">
                      {results.filter(r => !r.isInternal).length}
                    </div>
                    <div className="text-sm text-palette-primary">{t('links.externalLinks')}</div>
                  </CardContent>
                </Card>
              </div>
            )}


            {/* Results Table */}
            {results.length > 0 && (
              <Card className="border-palette-accent-2 shadow-xl">
                <CardHeader className="bg-white">
                  <CardTitle className="text-xl font-bold text-slate-800 text-center">{t('links.linkCheckResults')}</CardTitle>
                  <CardDescription className="text-slate-600 text-center mt-2">
                    {t('links.detailedAnalysisDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                      <thead className="border-b border-slate-200">
                        <tr>
                          <th className="text-left p-3 font-semibold text-slate-700 w-2/5">{t('links.linkUrl')}</th>
                          <th className="text-center p-3 font-semibold text-slate-700 w-16">{t('links.statusCode')}</th>
                          <th className="text-center p-3 font-semibold text-slate-700 w-20">{t('links.status')}</th>
                          <th className="text-center p-3 font-semibold text-slate-700 w-24">{t('links.responseTime')}</th>
                          <th className="text-center p-3 font-semibold text-slate-700 w-20">{t('links.type')}</th>
                          <th className="text-center p-3 font-semibold text-slate-700 w-32">{t('links.errorResponse')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((result, index) => (
                          <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-3 w-2/5">
                              <div className="flex items-center gap-2">
                                <ExternalLink className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                <a 
                                  href={result.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
                                  title={result.url}
                                >
                                  {result.url}
                                </a>
                              </div>
                            </td>
                            <td className="p-3 text-center w-16">
                              <Badge variant="outline" className={`${getStatusColor(result.status)} border-0 text-xs`}>
                                {result.status || t('links.error')}
                              </Badge>
                            </td>
                            <td className="p-3 text-center w-20">
                              <div className="flex items-center justify-center gap-1">
                                {getStatusIcon(result.status)}
                                <span className="text-xs">
                                  {result.status === 0 ? t('links.failed') : 
                                   result.status >= 200 && result.status < 300 ? t('links.success') :
                                   result.status >= 300 && result.status < 400 ? t('links.redirect') : t('links.failed')}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-center w-24">
                              <span className="text-xs text-slate-600">
                                {result.responseTime}ms
                              </span>
                            </td>
                            <td className="p-3 text-center w-20">
                              <Badge variant="outline" className={`text-xs ${result.isInternal ? "border-blue-200 text-blue-700 bg-blue-50" : "border-palette-accent-2 text-palette-primary bg-palette-accent-3"}`}>
                                {result.isInternal ? t('links.internal') : t('links.external')}
                              </Badge>
                            </td>
                            <td className="p-3 text-center w-32">
                              <div className="text-center">
                                {result.error ? (
                                  <div className="text-xs">
                                    <div className="text-red-600 font-medium mb-1">
                                      {result.error.split(' - ')[0]}
                                    </div>
                                    {result.error.includes(' - ') && (
                                      <div className="text-xs text-red-500">
                                        {result.error.split(' - ').slice(1).join(' - ')}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-green-600">
                                    {result.statusText || t('links.ok')}
                                  </span>
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
            )}
          </div>
        </section>
      )}

      {/* Call to Action Section - Only show after results */}
      {(results.length > 0 || statusMessage) && (
        <ConsultationCTA
          title={t('links.ctaTitle')}
          description={t('links.ctaDescription')}
          secondaryButtonHref="/links-info"
        />
      )}
    </div>
  )
}
