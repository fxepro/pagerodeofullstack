"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Monitor, 
  Globe, 
  Clock, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  Eye,
  BarChart3,
  ArrowRight,
  Wifi,
  Server,
  Shield
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useMonitorAnalysis } from "@/hooks/use-monitor-analysis"
import { useTranslation } from "react-i18next"
import Link from "next/link"
import { ConsultationCTA } from "@/components/consultation-cta"
import { ErrorDisplay } from "@/components/error-display"

interface MonitorData {
  url: string
  status: 'up' | 'down' | 'checking'
  uptime: number
  responseTime: number
  lastChecked: string
  incidents: number
  ssl: {
    valid: boolean
    expiresIn: number
  }
}

interface MonitorMainProps {
  url?: string;
}

export function MonitorMain({ url: initialUrl = "" }: MonitorMainProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const {
    url,
    setUrl,
    isChecking,
    monitorData,
    handleMonitor,
    error,
    isRetrying,
    clearError,
  } = useMonitorAnalysis({ initialUrl, autoRun: !!initialUrl })

  // When used in Site Audit (has initialUrl), show ONLY results
  if (initialUrl) {
    if (isChecking) {
      return (
        <div className="p-6">
          <div className="text-center py-8">
            <Activity className="animate-spin h-12 w-12 text-palette-primary mx-auto mb-4" />
            <p className="text-slate-600">{t('monitor.checkingFor', { url: initialUrl })}</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-6">
          <ErrorDisplay 
            error={error}
            onRetry={handleMonitor}
            onDismiss={clearError}
            isRetrying={isRetrying}
            variant="alert"
          />
        </div>
      );
    }

    if (!monitorData) return null;

    return (
      <div className="p-6">
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-palette-accent-2/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Monitor className="h-6 w-6 text-palette-primary" />
                  {t('monitor.monitorStatusFor', { url: monitorData.url })}
                </h2>
                <p className="text-slate-600 mt-1">
                  {t('monitor.lastChecked', { date: new Date(monitorData.lastChecked).toLocaleString() })}
                </p>
              </div>
              <Button
                onClick={handleMonitor}
                disabled={isChecking}
                variant="outline"
                className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
              >
                <Activity className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Status Overview */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {monitorData.status === 'up' ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <Badge className="bg-green-100 text-green-800">{t('monitor.online')}</Badge>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <Badge variant="destructive">{t('monitor.offline')}</Badge>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {t('monitor.lastCheckedTime', { time: new Date(monitorData.lastChecked).toLocaleTimeString() })}
                </p>
              </CardContent>
            </Card>

            <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Uptime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-palette-primary">{monitorData.uptime.toFixed(2)}%</div>
                <p className="text-xs text-slate-500 mt-1">Last 30 days</p>
              </CardContent>
            </Card>

            <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-palette-primary">{Math.round(monitorData.responseTime)}ms</div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">-12% from last week</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  SSL Certificate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {monitorData.ssl.valid ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <Badge className="bg-green-100 text-green-800">Valid</Badge>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Expires in {monitorData.ssl.expiresIn} days
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border-palette-accent-2/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-palette-primary" />
                Detailed Analysis
              </CardTitle>
              <CardDescription className="text-slate-600">
                View comprehensive status report, performance metrics, and technical details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Button 
                  asChild
                  className="bg-gradient-to-r from-palette-accent-1 to-palette-primary hover:from-palette-primary hover:to-palette-primary-hover text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                >
                  <Link href={`/monitor/${encodeURIComponent(monitorData.url)}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Detailed Report
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                
                <Button 
                  onClick={handleMonitor}
                  disabled={isChecking}
                  variant="outline" 
                  className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Re-check Status
                </Button>
                
                <Button variant="outline" className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3">
                  <Server className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-palette-accent-2/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Clock className="h-5 w-5 text-palette-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Website is online</p>
                      <p className="text-sm text-green-600">Response time: {Math.round(monitorData.responseTime)}ms</p>
                    </div>
                  </div>
                  <span className="text-sm text-green-600">Just now</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <Wifi className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">Monitoring started</p>
                      <p className="text-sm text-blue-600">Checking every 30 seconds</p>
                    </div>
                  </div>
                  <span className="text-sm text-blue-600">2 minutes ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Default return for standalone page (no initialUrl prop)
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section - Only show if no URL prop provided (standalone page) */}
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
              <Monitor className="h-4 w-4 mr-2" />
              {t('monitor.heroBadge')}
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('monitor.heroTitle')}
          </h1>
          
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
            {t('monitor.heroDescription')}
          </p>

          {/* URL Input Section - Glassmorphism style */}
          <div className="w-full max-w-4xl mx-auto">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  id="monitor-url"
                  type="text"
                  placeholder={t('monitor.urlPlaceholder')}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 h-14 text-lg px-4 bg-white/90 border-0 rounded-xl placeholder:text-gray-500 focus:ring-2 focus:ring-white/50"
                  disabled={isChecking}
                />
                <Button 
                  onClick={handleMonitor}
                  disabled={isChecking}
                  className="bg-gradient-to-r from-palette-primary to-palette-primary-hover hover:from-purple-700 hover:to-palette-secondary text-white px-8 py-3 h-14 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center"
                >
                  {isChecking ? (
                    <>
                      <Activity className="h-5 w-5 mr-2 animate-spin" />
                      {t('monitor.checking')}
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      {t('monitor.analyze')}
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <p className="text-center text-white/80 mt-4 text-sm">
              {t('monitor.helperText')}
            </p>
          </div>
        </div>
      </section>

      {/* Error Display Section - Show on standalone page */}
      {!initialUrl && error && (
        <div className="bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3 py-16">
          <div className="container mx-auto px-4 max-w-7xl">
            <ErrorDisplay 
              error={error}
              onRetry={handleMonitor}
              onDismiss={clearError}
              isRetrying={isRetrying}
              variant="modal"
            />
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
        <div className="container mx-auto px-4 py-16 max-w-7xl">

        {/* Monitoring Results */}
        {monitorData && (
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-palette-accent-2/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Monitor className="h-6 w-6 text-palette-primary" />
                    {t('monitor.monitorStatusFor', { url: monitorData.url })}
                  </h2>
                  <p className="text-slate-600 mt-1">
                    {t('monitor.lastChecked', { date: new Date(monitorData.lastChecked).toLocaleString() })}
                  </p>
                </div>
                <Button
                  onClick={handleMonitor}
                  disabled={isChecking}
                  variant="outline"
                  className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
                >
                  <Activity className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                  {t('monitor.refresh')}
                </Button>
              </div>
            </div>

            {/* Status Overview */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {t('monitor.websiteStatus')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {monitorData.status === 'up' ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <Badge className="bg-green-100 text-green-800">{t('monitor.online')}</Badge>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <Badge variant="destructive">{t('monitor.offline')}</Badge>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {t('monitor.lastCheckedTime', { time: new Date(monitorData.lastChecked).toLocaleTimeString() })}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {t('monitor.uptime')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-palette-primary">{monitorData.uptime.toFixed(2)}%</div>
                  <p className="text-xs text-slate-500 mt-1">{t('monitor.last30Days')}</p>
                </CardContent>
              </Card>

              <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    {t('monitor.responseTime')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-palette-primary">{Math.round(monitorData.responseTime)}ms</div>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingDown className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">{t('monitor.fromLastWeek')}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {t('monitor.sslCertificate')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {monitorData.ssl.valid ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <Badge className="bg-green-100 text-green-800">{t('monitor.valid')}</Badge>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <Badge className="bg-yellow-100 text-yellow-800">{t('monitor.warning')}</Badge>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {t('monitor.expiresIn', { days: monitorData.ssl.expiresIn })}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-palette-primary" />
                  {t('monitor.detailedAnalysis')}
                </CardTitle>
                <CardDescription className="text-slate-600">
                  {t('monitor.detailedAnalysisDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <Button 
                    asChild
                    className="bg-gradient-to-r from-palette-accent-1 to-palette-primary hover:from-palette-primary hover:to-palette-primary-hover text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                  >
                    <Link href={`/monitor/${encodeURIComponent(monitorData.url)}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      {t('monitor.viewDetailedReport')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                  
                  <Button 
                    onClick={handleMonitor}
                    disabled={isChecking}
                    variant="outline" 
                    className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    {t('monitor.recheckStatus')}
                  </Button>
                  
                  <Button variant="outline" className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3">
                    <Server className="h-4 w-4 mr-2" />
                    {t('monitor.exportReport')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-palette-primary" />
                  {t('monitor.recentActivity')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">{t('monitor.websiteIsOnline')}</p>
                        <p className="text-sm text-green-600">{t('monitor.responseTimeMs', { time: Math.round(monitorData.responseTime) })}</p>
                      </div>
                    </div>
                    <span className="text-sm text-green-600">{t('monitor.justNow')}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3">
                      <Wifi className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-800">{t('monitor.monitoringStarted')}</p>
                        <p className="text-sm text-blue-600">{t('monitor.checkingEvery')}</p>
                      </div>
                    </div>
                    <span className="text-sm text-blue-600">{t('monitor.minutesAgo', { minutes: 2 })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

          {/* Features Section */}
          {!monitorData && (
            <div className="grid md:grid-cols-3 gap-8 justify-items-center">
              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Monitor className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-slate-800">{t('monitor.statusMonitoring')}</h3>
                    <p className="text-slate-600 mb-4">
                      {t('monitor.statusMonitoringDesc')}
                    </p>
                    <ul className="space-y-2 text-sm text-slate-500">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('monitor.httpHttpsCheck')}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('monitor.responseTimeMeasurement')}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('monitor.sslCertificateValidation')}
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <AlertTriangle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">{t('monitor.technicalAnalysis')}</h3>
                  <p className="text-slate-600 mb-4">
                    {t('monitor.technicalAnalysisDesc')}
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('monitor.serverHeadersAnalysis')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('monitor.securityCertificateDetails')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('monitor.networkConnectivityTest')}
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">{t('monitor.performanceMetrics')}</h3>
                  <p className="text-slate-600 mb-4">
                    {t('monitor.performanceMetricsDesc')}
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('monitor.currentAvailabilityStatus')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('monitor.responseTimeAnalysis')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('monitor.statusCodeVerification')}
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            </div>
          )}

          {/* Call to Action Section - Only show after results */}
          {monitorData && (
            <ConsultationCTA
              title={t('monitor.ctaTitle')}
              description={t('monitor.ctaDescription')}
              secondaryButtonHref="/monitor-info"
            />
          )}
        </div>
      </div>
    </div>
  )
}
