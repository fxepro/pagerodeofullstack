"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "react-i18next"
import { useTypographyAnalysis } from "@/hooks/use-typography-analysis"
import { 
  Type,
  AlignLeft,
  Zap,
  Eye,
  Clock,
  FileText,
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  RefreshCw,
  Search,
  Lightbulb,
  Download,
  Settings
} from "lucide-react"
import { ConsultationCTA } from "@/components/consultation-cta"
import { ErrorDisplay } from "@/components/error-display"

interface TypographyElement {
  size: string
  lineHeight: string
  fontFamily: string
  fontWeight: string
  letterSpacing?: string
  count: number
}

interface FontVariant {
  weight: number
  style: 'normal' | 'italic'
  size: number
  format: string
  url?: string
}

interface FontFamily {
  family: string
  source: 'google' | 'custom' | 'system'
  variants: FontVariant[]
  usedOn: string[]
  settings: {
    display: string
    preload: boolean
    fallback?: string
  }
}

interface TypographyData {
  domain: string
  timestamp: string
  summary: {
    totalFamilies: number
    totalVariants: number
    totalSize: number
    googleFonts: number
    customFonts: number
    systemFonts: number
    loadTime: number
    overallScore: number
  }
  fonts: FontFamily[]
  typography: {
    h1: TypographyElement
    h2: TypographyElement
    h3: TypographyElement
    h4: TypographyElement
    h5: TypographyElement
    h6: TypographyElement
    body: TypographyElement
    small: TypographyElement
  }
  performance: {
    totalSize: number
    totalRequests: number
    loadTime: number
    renderBlocking: number
    strategy: {
      display: string
      preloaded: number
      async: number
    }
    score: number
  }
  readability: {
    overallScore: number
    breakdown: {
      fontSize: number
      lineHeight: number
      contrast: number
      hierarchy: number
    }
    strengths: string[]
    issues: string[]
  }
  issues: {
    severity: 'critical' | 'warning' | 'info'
    category: 'performance' | 'readability' | 'accessibility'
    message: string
    impact: string
  }[]
  recommendations: {
    priority: 'high' | 'medium' | 'low'
    category: string
    title: string
    description: string
    savings?: string
  }[]
}

interface TypographyMainProps {
  url?: string;
}

export function TypographyMain({ url: initialUrl = "" }: TypographyMainProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const {
    url,
    setUrl,
    isAnalyzing,
    typographyData,
    runAnalysis,
    error,
    isRetrying,
    clearError,
  } = useTypographyAnalysis({ initialUrl, autoRun: !!initialUrl })

  const handleAnalyze = () => {
    runAnalysis()
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: t('typography.copied'),
      description: t('typography.textCopied'),
    })
  }

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'google':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'custom':
        return 'bg-palette-accent-3 text-purple-800 border-palette-accent-2'
      case 'system':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200'
    if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getPerformanceStatus = (score: number) => {
    if (score >= 80) return { label: t('typography.excellent'), color: 'text-green-600' }
    if (score >= 60) return { label: t('typography.good'), color: 'text-blue-600' }
    if (score >= 40) return { label: t('typography.fair'), color: 'text-yellow-600' }
    return { label: t('typography.poor'), color: 'text-red-600' }
  }

  // When used in Site Audit (has initialUrl), show ONLY results
  if (initialUrl) {
    if (isAnalyzing) {
      return (
        <div className="p-6">
          <div className="text-center py-8">
            <RefreshCw className="animate-spin h-12 w-12 text-palette-primary mx-auto mb-4" />
            <p className="text-slate-600">{t('typography.analyzingFor', { url: initialUrl })}</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-6">
          <ErrorDisplay 
            error={error}
            onRetry={runAnalysis}
            onDismiss={clearError}
            isRetrying={isRetrying}
            variant="alert"
          />
        </div>
      );
    }

    if (!typographyData) return null;

    // Show results only (reusing the results section from the full page)
    return (
      <div className="p-6">
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-palette-accent-2/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Type className="h-6 w-6 text-palette-primary" />
                  {t('typography.typographyAnalysisFor', { domain: typographyData.domain })}
                </h2>
                <p className="text-slate-600 mt-1">
                  {t('typography.analyzedOn', { timestamp: new Date(typographyData.timestamp).toLocaleString() })}
                </p>
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                variant="outline"
                className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                {t('typography.reanalyze')}
              </Button>
            </div>
          </div>

          {/* Summary Card */}
          <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-palette-accent-3/30">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl w-fit shadow-purple-200/50 shadow-lg">
                    <Type className="h-6 w-6 text-palette-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">{t('typography.fontTypographySummary')}</h3>
                    <p className="text-slate-600">{t('typography.completeAnalysisDesc')}</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-palette-primary">
                    {typographyData.summary.overallScore}/100
                  </div>
                  <div className="text-sm text-slate-600">{t('typography.overallScore')}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-white rounded-lg border border-purple-100">
                  <div className="text-3xl font-bold text-palette-primary">{typographyData.summary.totalFamilies}</div>
                  <div className="text-sm text-slate-600 mt-1">{t('typography.fontFamilies')}</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
                  <div className="text-3xl font-bold text-blue-600">{typographyData.summary.totalVariants}</div>
                  <div className="text-sm text-slate-600 mt-1">{t('typography.fontVariants')}</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-orange-100">
                  <div className="text-3xl font-bold text-orange-600">{typographyData.summary.totalSize}KB</div>
                  <div className="text-sm text-slate-600 mt-1">{t('typography.totalSize')}</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-green-100">
                  <div className="text-3xl font-bold text-green-600">{typographyData.summary.googleFonts}</div>
                  <div className="text-sm text-slate-600 mt-1">{t('typography.googleFonts')}</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-purple-100">
                  <div className="text-3xl font-bold text-palette-primary">{typographyData.summary.customFonts}</div>
                  <div className="text-sm text-slate-600 mt-1">{t('typography.customFonts')}</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-indigo-100">
                  <div className="text-3xl font-bold text-indigo-600">{typographyData.summary.loadTime}ms</div>
                  <div className="text-sm text-slate-600 mt-1">{t('typography.loadTime')}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FONTS SECTION */}
          <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50/30">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl w-fit shadow-blue-200/50 shadow-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">{t('typography.fontFamiliesTitle')}</h3>
                    <p className="text-slate-600">{t('typography.allFontsLoaded')}</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                  {t('typography.families', { count: typographyData.summary.totalFamilies })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-6">
                {typographyData.fonts.map((font, index) => (
                  <div 
                    key={index}
                    className={`bg-gradient-to-br ${
                      font.source === 'google' ? 'from-blue-50 to-blue-100/50 border-blue-200/50' :
                      font.source === 'custom' ? 'from-palette-accent-3 to-palette-accent-3/50 border-palette-accent-2/50' :
                      'from-green-50 to-green-100/50 border-green-200/50'
                    } rounded-xl p-5 border`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Type className={`h-5 w-5 ${
                          font.source === 'google' ? 'text-blue-600' :
                          font.source === 'custom' ? 'text-palette-primary' :
                          'text-green-600'
                        }`} />
                        <h4 className="font-bold text-slate-800 text-lg">{font.family}</h4>
                      </div>
                      <Badge className={getSourceBadgeColor(font.source)}>
                        {font.source === 'google' ? t('typography.googleFontsLabel') : 
                         font.source === 'custom' ? t('typography.custom') : t('typography.system')}
                      </Badge>
                    </div>

                    {/* Variants */}
                    <div className="mb-4">
                      <div className="text-sm font-medium text-slate-600 mb-2">{t('typography.variants')}</div>
                      <div className="space-y-1">
                        {font.variants.map((variant, vIndex) => (
                          <div key={vIndex} className="text-xs text-slate-700 bg-white rounded px-2 py-1 font-mono">
                            {variant.weight} {variant.style !== 'normal' && `(${variant.style})`} - {variant.size}KB - {variant.format}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Used On */}
                    <div className="mb-4">
                      <div className="text-sm font-medium text-slate-600 mb-2">{t('typography.usedOn')}</div>
                      <div className="flex flex-wrap gap-1">
                        {font.usedOn.map((usage, uIndex) => (
                          <Badge key={uIndex} variant="outline" className="text-xs">
                            {usage}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Settings */}
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>{t('typography.display')} <span className="font-mono text-slate-800">{font.settings.display}</span></div>
                      <div>{t('typography.preload')} <span className="font-mono text-slate-800">{font.settings.preload ? t('typography.yes') : t('typography.no')}</span></div>
                      {font.settings.fallback && (
                        <div>{t('typography.fallback')} <span className="font-mono text-slate-800">{font.settings.fallback}</span></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* TYPOGRAPHY SECTION */}
          <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50/30">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl w-fit shadow-indigo-200/50 shadow-lg">
                    <AlignLeft className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                        <h3 className="text-2xl font-bold text-slate-800">{t('typography.typographyHierarchy')}</h3>
                        <p className="text-slate-600">{t('typography.textSizingDesc')}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">{t('typography.element')}</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">{t('typography.size')}</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">{t('typography.lineHeight')}</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">{t('typography.font')}</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">{t('typography.count')}</th>
                        </tr>
                  </thead>
                  <tbody>
                    {Object.entries(typographyData.typography).map(([element, styles], index) => (
                      <tr key={element} className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm font-semibold text-palette-primary">
                            {element.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-sm text-slate-700">{styles.size}</td>
                        <td className="py-3 px-4 font-mono text-sm text-slate-700">{styles.lineHeight}</td>
                        <td className="py-3 px-4 text-sm text-slate-700">{styles.fontFamily}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline" className="text-xs">{styles.count}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section - Half size */}
      <section className="relative min-h-[50vh] flex items-center justify-center bg-gradient-to-br from-palette-accent-2 via-palette-accent-1 to-palette-primary">
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
          <div className="mb-6">
            <Badge variant="outline" className="border-white/40 text-white bg-white/15 backdrop-blur-sm px-6 py-2 text-sm font-medium shadow-lg">
              <Type className="h-4 w-4 mr-2" />
              {t('typography.heroBadge')}
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('typography.heroTitle')}
          </h1>
          
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
            {t('typography.heroDescription')}
          </p>

          {/* URL Input Section - Glassmorphism style */}
          <div className="w-full max-w-4xl mx-auto">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  id="typography-url"
                  type="text"
                  placeholder={t('typography.urlPlaceholder')}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && runAnalysis()}
                  className="flex-1 h-14 text-lg px-4 bg-white/90 border-0 rounded-xl placeholder:text-gray-500 focus:ring-2 focus:ring-white/50"
                  disabled={isAnalyzing}
                />
                <Button 
                  onClick={runAnalysis}
                  disabled={isAnalyzing}
                  className="bg-gradient-to-r from-palette-primary to-palette-primary-hover hover:from-purple-700 hover:to-palette-secondary text-white px-8 py-3 h-14 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      {t('typography.analyzing')}
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      {t('typography.analyzeTypography')}
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <p className="text-center text-white/80 mt-4 text-sm">
              {t('typography.analyzeDescription')}
            </p>
          </div>
        </div>
      </section>

      <div className="bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
        <div className="container mx-auto px-4 py-16 max-w-7xl">

          {/* Results Section */}
          {typographyData && (
            <div className="space-y-8">
              {/* Header */}
              <div className="bg-white rounded-lg shadow-lg p-6 border border-palette-accent-2/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                      <Type className="h-6 w-6 text-palette-primary" />
                      {t('typography.typographyAnalysisFor', { domain: typographyData.domain })}
                    </h2>
                    <p className="text-slate-600 mt-1">
                      {t('typography.analyzedOn', { timestamp: new Date(typographyData.timestamp).toLocaleString() })}
                    </p>
                  </div>
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    variant="outline"
                    className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    {t('typography.reanalyze')}
                  </Button>
                </div>
              </div>

              {/* Summary Card */}
              <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-palette-accent-3/30">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl w-fit shadow-purple-200/50 shadow-lg">
                        <Type className="h-6 w-6 text-palette-primary" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800">{t('typography.fontTypographySummary')}</h3>
                        <p className="text-slate-600">{t('typography.completeAnalysisDesc')}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-palette-primary">
                        {typographyData.summary.overallScore}/100
                      </div>
                      <div className="text-sm text-slate-600">{t('typography.overallScore')}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-white rounded-lg border border-purple-100">
                      <div className="text-3xl font-bold text-palette-primary">{typographyData.summary.totalFamilies}</div>
                      <div className="text-sm text-slate-600 mt-1">{t('typography.fontFamilies')}</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
                  <div className="text-3xl font-bold text-blue-600">{typographyData.summary.totalVariants}</div>
                  <div className="text-sm text-slate-600 mt-1">{t('typography.fontVariants')}</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-orange-100">
                  <div className="text-3xl font-bold text-orange-600">{typographyData.summary.totalSize}KB</div>
                  <div className="text-sm text-slate-600 mt-1">{t('typography.totalSize')}</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-green-100">
                  <div className="text-3xl font-bold text-green-600">{typographyData.summary.googleFonts}</div>
                  <div className="text-sm text-slate-600 mt-1">{t('typography.googleFonts')}</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-purple-100">
                  <div className="text-3xl font-bold text-palette-primary">{typographyData.summary.customFonts}</div>
                  <div className="text-sm text-slate-600 mt-1">{t('typography.customFonts')}</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-indigo-100">
                  <div className="text-3xl font-bold text-indigo-600">{typographyData.summary.loadTime}ms</div>
                  <div className="text-sm text-slate-600 mt-1">{t('typography.loadTime')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FONTS SECTION (Above) */}
              <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50/30">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl w-fit shadow-blue-200/50 shadow-lg">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800">{t('typography.fontFamiliesTitle')}</h3>
                        <p className="text-slate-600">{t('typography.allFontsLoaded')}</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                      {t('typography.families', { count: typographyData.summary.totalFamilies })}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    {typographyData.fonts.map((font, index) => (
                      <div 
                        key={index}
                        className={`bg-gradient-to-br ${
                          font.source === 'google' ? 'from-blue-50 to-blue-100/50 border-blue-200/50' :
                          font.source === 'custom' ? 'from-palette-accent-3 to-palette-accent-3/50 border-palette-accent-2/50' :
                          'from-green-50 to-green-100/50 border-green-200/50'
                        } rounded-xl p-5 border`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Type className={`h-5 w-5 ${
                              font.source === 'google' ? 'text-blue-600' :
                              font.source === 'custom' ? 'text-palette-primary' :
                              'text-green-600'
                            }`} />
                            <h4 className="font-bold text-slate-800 text-lg">{font.family}</h4>
                          </div>
                          <Badge className={getSourceBadgeColor(font.source)}>
                            {font.source === 'google' ? t('typography.googleFontsLabel') : 
                             font.source === 'custom' ? t('typography.custom') : t('typography.system')}
                          </Badge>
                        </div>

                        {/* Variants */}
                        <div className="mb-4">
                          <div className="text-sm font-medium text-slate-600 mb-2">{t('typography.variants')}</div>
                          <div className="space-y-1">
                            {font.variants.map((variant, vIndex) => (
                              <div key={vIndex} className="text-xs text-slate-700 bg-white rounded px-2 py-1 font-mono">
                                {variant.weight} {variant.style !== 'normal' && `(${variant.style})`} - {variant.size}KB - {variant.format}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Used On */}
                        <div className="mb-4">
                          <div className="text-sm font-medium text-slate-600 mb-2">{t('typography.usedOn')}</div>
                          <div className="flex flex-wrap gap-1">
                            {font.usedOn.map((usage, uIndex) => (
                              <Badge key={uIndex} variant="outline" className="text-xs">
                                {usage}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Settings */}
                        <div className="text-xs text-slate-600 space-y-1">
                          <div>{t('typography.display')} <span className="font-mono text-slate-800">{font.settings.display}</span></div>
                          <div>{t('typography.preload')} <span className="font-mono text-slate-800">{font.settings.preload ? t('typography.yes') : t('typography.no')}</span></div>
                          {font.settings.fallback && (
                            <div>{t('typography.fallback')} <span className="font-mono text-slate-800">{font.settings.fallback}</span></div>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* TYPOGRAPHY SECTION (Below) */}
              <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50/30">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl w-fit shadow-indigo-200/50 shadow-lg">
                        <AlignLeft className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800">{t('typography.typographyHierarchy')}</h3>
                        <p className="text-slate-600">{t('typography.textSizingDesc')}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">{t('typography.element')}</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">{t('typography.size')}</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">{t('typography.lineHeight')}</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">{t('typography.font')}</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">{t('typography.count')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(typographyData.typography).map(([element, styles], index) => (
                          <tr key={element} className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                            <td className="py-3 px-4">
                              <span className="font-mono text-sm font-semibold text-palette-primary">
                                {element.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-sm text-slate-700">{styles.size}</td>
                            <td className="py-3 px-4 font-mono text-sm text-slate-700">{styles.lineHeight}</td>
                            <td className="py-3 px-4 text-sm text-slate-700">{styles.fontFamily}</td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant="outline" className="text-xs">{styles.count}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <div className="grid md:grid-cols-4 gap-6">
                <Card className="border-orange-200/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="h-8 w-8 text-orange-600" />
                      <div>
                        <div className="text-3xl font-bold text-slate-800">
                          {typographyData.performance.loadTime}ms
                        </div>
                        <div className="text-sm text-slate-600">{t('typography.loadTime')}</div>
                      </div>
                    </div>
                    <Badge className={getScoreBadgeColor(typographyData.performance.score)}>
                      {getPerformanceStatus(typographyData.performance.score).label}
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="border-blue-200/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <div className="text-3xl font-bold text-slate-800">
                          {typographyData.performance.totalSize}KB
                        </div>
                        <div className="text-sm text-slate-600">{t('typography.totalSizeLabel')}</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {t('typography.requests', { count: typographyData.performance.totalRequests })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-palette-accent-2/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Settings className="h-8 w-8 text-palette-primary" />
                      <div>
                        <div className="text-2xl font-bold text-slate-800">
                          {typographyData.performance.strategy.display}
                        </div>
                        <div className="text-sm text-slate-600">{t('typography.fontDisplay')}</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {t('typography.preloaded', { count: typographyData.performance.strategy.preloaded })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Eye className="h-8 w-8 text-green-600" />
                      <div>
                        <div className="text-3xl font-bold text-slate-800">
                          {typographyData.readability.overallScore}
                        </div>
                        <div className="text-sm text-slate-600">{t('typography.readability')}</div>
                      </div>
                    </div>
                    <Badge className={getScoreBadgeColor(typographyData.readability.overallScore)}>
                      {getPerformanceStatus(typographyData.readability.overallScore).label}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Readability Analysis */}
              <Card className="border-indigo-200/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-indigo-50/30">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl w-fit shadow-indigo-200/50 shadow-lg">
                      <Eye className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800">{t('typography.readabilityAnalysis')}</h3>
                      <p className="text-slate-600">{t('typography.typographyQualityDesc')}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {/* Score Breakdown */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-800 mb-3">{t('typography.scoreBreakdown')}</h4>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">{t('typography.fontSize')}</span>
                          <span className="text-sm font-semibold text-slate-800">{typographyData.readability.breakdown.fontSize}/25</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-palette-primary h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(typographyData.readability.breakdown.fontSize / 25) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">{t('typography.lineHeightLabel')}</span>
                          <span className="text-sm font-semibold text-slate-800">{typographyData.readability.breakdown.lineHeight}/30</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(typographyData.readability.breakdown.lineHeight / 30) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">{t('typography.contrast')}</span>
                          <span className="text-sm font-semibold text-slate-800">{typographyData.readability.breakdown.contrast}/20</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(typographyData.readability.breakdown.contrast / 20) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">{t('typography.hierarchy')}</span>
                          <span className="text-sm font-semibold text-slate-800">{typographyData.readability.breakdown.hierarchy}/25</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(typographyData.readability.breakdown.hierarchy / 25) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Strengths */}
                    {typographyData.readability.strengths.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          {t('typography.strengths')}
                        </h4>
                        <ul className="space-y-1">
                          {typographyData.readability.strengths.map((strength, index) => (
                            <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Issues */}
                    {typographyData.readability.issues.length > 0 && (
                      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          {t('typography.areasForImprovement')}
                        </h4>
                        <ul className="space-y-1">
                          {typographyData.readability.issues.map((issue, index) => (
                            <li key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Issues & Recommendations */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Issues */}
                {typographyData.issues.length > 0 && (
                  <Card className="border-red-200 bg-red-50/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-700">
                        <XCircle className="h-5 w-5" />
                        {t('typography.issuesFound', { count: typographyData.issues.length })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {typographyData.issues.map((issue, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 border border-red-200">
                            <div className="flex items-start gap-2">
                              <Badge className={
                                issue.severity === 'critical' ? 'bg-red-600 text-white' :
                                issue.severity === 'warning' ? 'bg-orange-500 text-white' :
                                'bg-blue-500 text-white'
                              }>
                                {issue.severity === 'critical' ? t('typography.critical') :
                                 issue.severity === 'warning' ? t('typography.warning') :
                                 t('typography.info')}
                              </Badge>
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-slate-800">{issue.message}</div>
                                <div className="text-xs text-slate-600 mt-1">{issue.impact}</div>
                                <Badge variant="outline" className="text-xs mt-2">
                                  {issue.category}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                {typographyData.recommendations.length > 0 && (
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-700">
                        <Lightbulb className="h-5 w-5" />
                        {t('typography.recommendations', { count: typographyData.recommendations.length })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {typographyData.recommendations.map((rec, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 border border-blue-200">
                            <div className="flex items-start gap-2">
                              <Badge className={
                                rec.priority === 'high' ? 'bg-blue-600 text-white' :
                                rec.priority === 'medium' ? 'bg-blue-500 text-white' :
                                'bg-blue-400 text-white'
                              }>
                                {rec.priority === 'high' ? t('typography.high') :
                                 rec.priority === 'medium' ? t('typography.medium') :
                                 t('typography.low')}
                              </Badge>
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-slate-800">{rec.title}</div>
                                <div className="text-xs text-slate-600 mt-1">{rec.description}</div>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {rec.category}
                                  </Badge>
                                  {rec.savings && (
                                    <Badge className="bg-green-100 text-green-700 text-xs">
                                      {t('typography.save', { savings: rec.savings })}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Call to Action Section - Only show after results */}
              <ConsultationCTA
                title={t('typography.ctaTitle')}
                description={t('typography.ctaDescription')}
                secondaryButtonHref="/typography-info"
              />
            </div>
          )}

          {/* Error Display Section - Show on standalone page */}
          {error && (
            <div className="mb-8">
              <ErrorDisplay 
                error={error}
                onRetry={runAnalysis}
                onDismiss={clearError}
                isRetrying={isRetrying}
                variant="modal"
              />
            </div>
          )}

          {/* Features Section - Show when no results */}
          {!typographyData && (
            <div className="grid md:grid-cols-3 gap-8 justify-items-center">
              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Type className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-slate-800">{t('typography.fontDetection')}</h3>
                    <p className="text-slate-600 mb-4">
                      {t('typography.fontDetectionDesc')}
                    </p>
                    <ul className="space-y-2 text-sm text-slate-500">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('typography.fontFamiliesVariants')}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('typography.googleFontsIdentification')}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('typography.customSystemFonts')}
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
                      <AlignLeft className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-slate-800">{t('typography.typographyHierarchyTitle')}</h3>
                    <p className="text-slate-600 mb-4">
                      {t('typography.typographyHierarchyDesc')}
                    </p>
                    <ul className="space-y-2 text-sm text-slate-500">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('typography.fontSizesLineHeights')}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('typography.headingHierarchy')}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('typography.readabilityContrastScores')}
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-slate-800">{t('typography.performanceInsights')}</h3>
                    <p className="text-slate-600 mb-4">
                      {t('typography.performanceInsightsDesc')}
                    </p>
                    <ul className="space-y-2 text-sm text-slate-500">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('typography.fontFileSizes')}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('typography.loadingStrategies')}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('typography.performanceRecommendations')}
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

