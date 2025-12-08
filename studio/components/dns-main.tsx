"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useDnsAnalysis } from "@/hooks/use-dns-analysis";
import { useTranslation } from "react-i18next";
import { ErrorDisplay } from "@/components/error-display";
import { 
  Server, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Copy, 
  RefreshCw,
  Globe,
  Clock,
  Wifi,
  FileText
} from "lucide-react";
import { ConsultationCTA } from "@/components/consultation-cta";

interface DNSData {
  domain: string
  timestamp: string
  dns: {
    ipv4: string[]
    ipv6: string[]
    mx: string[]
    txt: string[]
    ns: string[]
    soa: {
      nsname: string
      hostmaster: string
      serial: number
      refresh: number
      retry: number
      expire: number
      minttl: number
    } | null
    cname: string[]
    srv: {
      name: string
      port: number
      priority: number
      weight: number
      target: string
    }[]
  }
}

interface DnsMainProps {
  url?: string;
}

export function DnsMain({ url: initialUrl = "" }: DnsMainProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const {
    domain,
    setDomain,
    isChecking,
    dnsData,
    showAllTxt,
    setShowAllTxt,
    handleCheck,
    error,
    isRetrying,
    clearError,
  } = useDnsAnalysis({ initialUrl, autoRun: !!initialUrl })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: t('dns.copied'),
      description: t('dns.copiedDesc'),
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">✓ {t('dns.found')}</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">✗ {t('dns.error')}</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{t('dns.unknown')}</Badge>
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  // When used in Site Audit (has initialUrl), show ONLY results
  if (initialUrl) {
    if (isChecking) {
      return (
        <div className="p-6">
          <div className="text-center py-8">
            <RefreshCw className="animate-spin h-12 w-12 text-palette-primary mx-auto mb-4" />
            <p className="text-slate-600">{t('dns.checkingFor', { url: initialUrl })}</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-6">
          <ErrorDisplay 
            error={error}
            onRetry={handleCheck}
            onDismiss={clearError}
            isRetrying={isRetrying}
            variant="alert"
          />
        </div>
      );
    }

    if (!dnsData) return null;

    const totalRecords = dnsData.dns.ipv4.length + dnsData.dns.ipv6.length + dnsData.dns.mx.length + dnsData.dns.txt.length + dnsData.dns.ns.length + (dnsData.dns.soa ? 1 : 0) + dnsData.dns.cname.length + dnsData.dns.srv.length;

    return (
      <div className="p-6">
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-palette-accent-2/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Globe className="h-6 w-6 text-palette-primary" />
                  {t('dns.dnsRecordsFor', { domain: dnsData.domain })}
                </h2>
                <p className="text-slate-600 mt-1">
                  {t('dns.lastChecked', { date: formatTimestamp(dnsData.timestamp), count: totalRecords })}
                </p>
              </div>
              <Button
                onClick={handleCheck}
                disabled={isChecking}
                variant="outline"
                className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                {t('dns.recheck')}
              </Button>
            </div>
          </div>

          {/* DNS Records Card */}
          <Card className="border-palette-accent-2/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Server className="h-5 w-5 text-palette-primary" />
                {t('dns.dnsRecords')}
              </CardTitle>
              <CardDescription className="text-slate-600">
                {t('dns.completeDnsConfig', { domain: dnsData.domain })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* IP Addresses (A & AAAA Records) */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-4 border border-blue-200/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-600" />
                      {t('dns.ipAddresses')}
                    </h3>
                    {(dnsData.dns.ipv4.length > 0 || dnsData.dns.ipv6.length > 0) ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {t('dns.records', { count: dnsData.dns.ipv4.length + dnsData.dns.ipv6.length })}
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600 border-gray-200">{t('dns.none')}</Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    {dnsData.dns.ipv4.length > 0 ? (
                      <>
                        <div className="text-xs text-slate-600 font-medium mb-1">{t('dns.ipv4Records')}</div>
                        {dnsData.dns.ipv4.map((ip, i) => (
                          <div key={i} className="flex items-center justify-between group bg-white rounded px-3 py-2 border border-blue-100">
                            <code className="text-sm text-slate-700 font-mono">{ip}</code>
                            <button onClick={() => copyToClipboard(ip)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                            </button>
                          </div>
                        ))}
                      </>
                    ) : null}
                    {dnsData.dns.ipv6.length > 0 ? (
                      <>
                        <div className="text-xs text-slate-600 font-medium mb-1 mt-3">{t('dns.ipv6Records')}</div>
                        {dnsData.dns.ipv6.map((ip, i) => (
                          <div key={i} className="flex items-center justify-between group bg-white rounded px-3 py-2 border border-blue-100">
                            <code className="text-sm text-slate-700 font-mono break-all">{ip}</code>
                            <button onClick={() => copyToClipboard(ip)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                              <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                            </button>
                          </div>
                        ))}
                      </>
                    ) : null}
                    {dnsData.dns.ipv4.length === 0 && dnsData.dns.ipv6.length === 0 && (
                      <div className="text-slate-500 text-sm text-center py-2">{t('dns.none')}</div>
                    )}
                  </div>
                </div>

                {/* Name Servers (NS Records) */}
                <div className="bg-gradient-to-br from-palette-accent-3 to-palette-accent-3/50 rounded-lg p-4 border border-palette-accent-2/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Server className="h-4 w-4 text-palette-primary" />
                      {t('dns.nameServers')}
                    </h3>
                    {dnsData.dns.ns.length > 0 ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {t('dns.servers', { count: dnsData.dns.ns.length })}
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600 border-gray-200">{t('dns.none')}</Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    {dnsData.dns.ns.length > 0 ? (
                      dnsData.dns.ns.map((ns, i) => (
                        <div key={i} className="flex items-center justify-between group bg-white rounded px-3 py-2 border border-purple-100">
                          <code className="text-sm text-slate-700 font-mono">{ns}</code>
                          <button onClick={() => copyToClipboard(ns)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500 text-sm text-center py-2">{t('dns.none')}</div>
                    )}
                  </div>
                </div>

                {/* Mail Servers (MX Records) */}
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-4 border border-green-200/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-green-600" />
                      {t('dns.mailServers')}
                    </h3>
                    {dnsData.dns.mx.length > 0 ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {t('dns.servers', { count: dnsData.dns.mx.length })}
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600 border-gray-200">{t('dns.none')}</Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    {dnsData.dns.mx.length > 0 ? (
                      dnsData.dns.mx.map((mx, i) => (
                        <div key={i} className="flex items-center justify-between group bg-white rounded px-3 py-2 border border-green-100">
                          <code className="text-sm text-slate-700 font-mono">{mx}</code>
                          <button onClick={() => copyToClipboard(mx)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500 text-sm text-center py-2">{t('dns.none')}</div>
                    )}
                  </div>
                </div>

                {/* TXT Records */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-lg p-4 border border-yellow-200/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-yellow-600" />
                      {t('dns.txtRecords')}
                    </h3>
                    {dnsData.dns.txt.length > 0 ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {t('dns.records', { count: dnsData.dns.txt.length })}
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600 border-gray-200">{t('dns.none')}</Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    {dnsData.dns.txt.length > 0 ? (
                      <>
                        {(showAllTxt ? dnsData.dns.txt : dnsData.dns.txt.slice(0, 3)).map((txt, i) => (
                          <div key={i} className="flex items-center justify-between group bg-white rounded px-3 py-2 border border-yellow-100">
                            <code className="text-xs text-slate-700 font-mono break-all flex-1">
                              {txt.length > 150 ? `${txt.substring(0, 150)}...` : txt}
                            </code>
                            <button onClick={() => copyToClipboard(txt)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                              <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                            </button>
                          </div>
                        ))}
                        {dnsData.dns.txt.length > 3 && (
                          <button
                            onClick={() => setShowAllTxt(!showAllTxt)}
                            className="text-sm text-palette-primary hover:text-palette-primary font-medium mt-2 w-full text-center"
                          >
                            {showAllTxt ? t('dns.showLess') : t('dns.showAll', { count: dnsData.dns.txt.length })}
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="text-slate-500 text-sm text-center py-2">{t('dns.none')}</div>
                    )}
                  </div>
                </div>

                {/* SOA Record */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg p-4 border border-orange-200/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      {t('dns.soaRecord')}
                    </h3>
                    {dnsData.dns.soa ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">{t('dns.found')}</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600 border-gray-200">{t('dns.none')}</Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    {dnsData.dns.soa ? (
                      <>
                        <div className="flex items-center justify-between group bg-white rounded px-3 py-2 border border-orange-100">
                          <div className="text-xs text-slate-600">{t('dns.primaryNs')}</div>
                          <code className="text-sm text-slate-700 font-mono">{dnsData.dns.soa.nsname}</code>
                          <button onClick={() => copyToClipboard(dnsData.dns.soa?.nsname || '')} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between group bg-white rounded px-3 py-2 border border-orange-100">
                          <div className="text-xs text-slate-600">{t('dns.admin')}</div>
                          <code className="text-sm text-slate-700 font-mono">{dnsData.dns.soa.hostmaster}</code>
                          <button onClick={() => copyToClipboard(dnsData.dns.soa?.hostmaster || '')} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between bg-white rounded px-3 py-2 border border-orange-100">
                          <div className="text-xs text-slate-600">{t('dns.serial')}</div>
                          <code className="text-sm text-slate-700 font-mono">{dnsData.dns.soa.serial}</code>
                        </div>
                      </>
                    ) : (
                      <div className="text-slate-500 text-sm text-center py-2">{t('dns.none')}</div>
                    )}
                  </div>
                </div>

                {/* CNAME Records */}
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-lg p-4 border border-indigo-200/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-indigo-600" />
                      {t('dns.cnameRecords')}
                    </h3>
                    {dnsData.dns.cname.length > 0 ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {t('dns.records', { count: dnsData.dns.cname.length })}
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600 border-gray-200">{t('dns.none')}</Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    {dnsData.dns.cname.length > 0 ? (
                      dnsData.dns.cname.map((cname, i) => (
                        <div key={i} className="flex items-center justify-between group bg-white rounded px-3 py-2 border border-indigo-100">
                          <code className="text-sm text-slate-700 font-mono">{cname}</code>
                          <button onClick={() => copyToClipboard(cname)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500 text-sm text-center py-2">{t('dns.none')}</div>
                    )}
                  </div>
                </div>

                {/* SRV Records */}
                <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-lg p-4 border border-teal-200/50 md:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Server className="h-4 w-4 text-teal-600" />
                      {t('dns.srvRecords')}
                    </h3>
                    {dnsData.dns.srv.length > 0 ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {t('dns.services', { count: dnsData.dns.srv.length })}
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600 border-gray-200">{t('dns.none')}</Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    {dnsData.dns.srv.length > 0 ? (
                      dnsData.dns.srv.map((srv, i) => (
                        <div key={i} className="bg-white rounded px-4 py-3 border border-teal-100">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <div className="text-xs text-slate-600">{t('dns.service')}</div>
                              <code className="text-slate-700 font-mono">{srv.name}</code>
                            </div>
                            <div>
                              <div className="text-xs text-slate-600">{t('dns.target')}</div>
                              <code className="text-slate-700 font-mono">{srv.target}:{srv.port}</code>
                            </div>
                            <div>
                              <div className="text-xs text-slate-600">{t('dns.priority')}</div>
                              <code className="text-slate-700 font-mono">{srv.priority}</code>
                            </div>
                            <div>
                              <div className="text-xs text-slate-600">{t('dns.weight')}</div>
                              <code className="text-slate-700 font-mono">{srv.weight}</code>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500 text-sm text-center py-2">{t('dns.none')}</div>
                    )}
                  </div>
                </div>
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
      {!initialUrl && (
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
              <Server className="h-4 w-4 mr-2" />
              {t('dns.heroBadge')}
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('dns.heroTitle')}
          </h1>
          
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
            {t('dns.heroDescription')}
          </p>

          {/* Domain Input Section - Glassmorphism style */}
          <div className="w-full max-w-4xl mx-auto">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  id="dns-domain"
                  type="text"
                  placeholder={t('dns.urlPlaceholder')}
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCheck()}
                  className="flex-1 h-14 text-lg px-4 bg-white/90 border-0 rounded-xl placeholder:text-gray-500 focus:ring-2 focus:ring-white/50"
                  disabled={isChecking}
                />
                <Button 
                  onClick={handleCheck}
                  disabled={isChecking}
                  className="bg-gradient-to-r from-palette-primary to-palette-primary-hover hover:from-purple-700 hover:to-palette-secondary text-white px-8 py-3 h-14 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center"
                >
                  {isChecking ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      {t('dns.checking')}
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      {t('dns.checkDns')}
                    </>
                  )}
                </Button>
              </div>
            </div>
            
          <p className="text-center text-white/80 mt-4 text-sm">
            {t('dns.helperText')}
          </p>
        </div>
      </div>
    </section>
    )}

    {/* Error Display Section - Show on standalone page when error occurs */}
    {!initialUrl && error && (
      <div className="bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3 py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <ErrorDisplay 
            error={error}
            onRetry={handleCheck}
            onDismiss={clearError}
            isRetrying={isRetrying}
            variant="modal"
          />
        </div>
      </div>
    )}

    <div className="bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
      <div className="container mx-auto px-4 py-16 max-w-7xl">

          {/* Results Section */}
          {dnsData && (
            <div className="space-y-8">
              {/* Header */}
              <div className="bg-white rounded-lg shadow-lg p-6 border border-palette-accent-2/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                      <Globe className="h-6 w-6 text-palette-primary" />
                      {t('dns.dnsRecordsFor', { domain: dnsData.domain })}
                    </h2>
                    <p className="text-slate-600 mt-1">
                      {t('dns.checkedOn', { date: formatTimestamp(dnsData.timestamp) })}
                    </p>
                  </div>
                  <Button
                    onClick={handleCheck}
                    disabled={isChecking}
                    variant="outline"
                    className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                    {t('dns.refresh')}
                  </Button>
                </div>
              </div>

              {/* DNS Records Section - Copied from SSL page */}
              <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50/30">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl w-fit shadow-blue-200/50 shadow-lg">
                        <Server className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800">{t('dns.dnsRecords')}</h3>
                        <p className="text-slate-600">{t('dns.completeDnsAnalysis', { domain: dnsData.domain })}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                      {t('dns.active')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-2 gap-8 auto-rows-min">
                    {/* 1. IP Addresses - Always show */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200/50">
                      <div className="flex items-center gap-2 mb-4">
                        <Globe className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-slate-800">{t('dns.ipAddresses')}</h4>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-2 py-1 text-xs">
                          {t('dns.records', { count: dnsData.dns.ipv4.length + dnsData.dns.ipv6.length })}
                        </Badge>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-slate-600 text-sm font-medium">{t('dns.ipv4Addresses')}</span>
                            <Badge className="bg-white text-slate-700 border px-2 py-0.5 text-xs">
                              {dnsData.dns.ipv4.length}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {dnsData.dns.ipv4.length > 0 ? (
                              dnsData.dns.ipv4.map((ip, index) => (
                                <div key={index} className="flex items-center justify-between group">
                                  <div className="text-slate-800 font-mono text-sm bg-white rounded-lg px-3 py-2 border flex-1 mr-2">
                                    {ip}
                                  </div>
                                  <button 
                                    onClick={() => copyToClipboard(ip)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded"
                                  >
                                    <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                                  </button>
                                </div>
                              ))
                            ) : (
                              <div className="text-slate-400 text-xs text-center py-2 bg-white/50 rounded border border-dashed">{t('dns.none')}</div>
                            )}
                          </div>
                        </div>
                        {true && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-slate-600 text-sm font-medium">{t('dns.ipv6Addresses')}</span>
                              <Badge className="bg-white text-slate-700 border px-2 py-0.5 text-xs">
                                {dnsData.dns.ipv6.length}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {dnsData.dns.ipv6.length > 0 ? (
                              dnsData.dns.ipv6.map((ip, index) => (
                                <div key={index} className="flex items-center justify-between group">
                                  <div className="text-slate-800 font-mono text-xs bg-white rounded-lg px-3 py-2 border flex-1 mr-2 break-all">
                                    {ip}
                                  </div>
                                  <button 
                                    onClick={() => copyToClipboard(ip)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded"
                                  >
                                    <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                                  </button>
                                </div>
                              ))
                            ) : (
                              <div className="text-slate-400 text-xs text-center py-2 bg-white/50 rounded border border-dashed">{t('dns.none')}</div>
                            )}
                          </div>
                        </div>
                        )}
                      </div>
                    </div>

                    {/* 2. Name Servers - Always show */}
                    <div className="bg-gradient-to-br from-palette-accent-3 to-palette-accent-3/50 rounded-xl p-5 border border-palette-accent-2/50">
                      <div className="flex items-center gap-2 mb-4">
                        <Wifi className="h-5 w-5 text-palette-primary" />
                        <h4 className="font-semibold text-slate-800">{t('dns.nameServers')}</h4>
                        <Badge className="bg-palette-accent-3 text-purple-800 border-palette-accent-2 px-2 py-1 text-xs">
                          {t('dns.ns', { count: dnsData.dns.ns.length })}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {dnsData.dns.ns.length > 0 ? (
                          dnsData.dns.ns.map((ns, index) => (
                            <div key={index} className="flex items-center justify-between group">
                              <div className="text-slate-800 font-mono text-sm bg-white rounded-lg px-3 py-2 border flex-1 mr-2">
                                {ns}
                              </div>
                              <button 
                                onClick={() => copyToClipboard(ns)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded"
                              >
                                <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-400 text-xs text-center py-2 bg-white/50 rounded border border-dashed">{t('dns.none')}</div>
                        )}
                      </div>
                    </div>

                    {/* 3. Mail Servers - Always show */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-5 border border-green-200/50">
                      <div className="flex items-center gap-2 mb-4">
                        <Server className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold text-slate-800">{t('dns.mailServers')}</h4>
                        <Badge className="bg-green-100 text-green-800 border-green-200 px-2 py-1 text-xs">
                          {t('dns.mx', { count: dnsData.dns.mx.length })}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {dnsData.dns.mx.length > 0 ? (
                          dnsData.dns.mx.map((mx, index) => (
                            <div key={index} className="flex items-center justify-between group">
                              <div className="text-slate-800 font-mono text-sm bg-white rounded-lg px-3 py-2 border flex-1 mr-2">
                                {mx}
                              </div>
                              <button 
                                onClick={() => copyToClipboard(mx)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded"
                              >
                                <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-400 text-xs text-center py-2 bg-white/50 rounded border border-dashed">{t('dns.none')}</div>
                        )}
                      </div>
                    </div>

                    {/* 4. TXT Records - Always show */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-5 border border-orange-200/50">
                        <div className="flex items-center gap-2 mb-4">
                          <FileText className="h-5 w-5 text-orange-600" />
                          <h4 className="font-semibold text-slate-800">{t('dns.txtRecords')}</h4>
                          <Badge className="bg-orange-100 text-orange-800 border-orange-200 px-2 py-1 text-xs">
                            {t('dns.records', { count: dnsData.dns.txt.length })}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {dnsData.dns.txt.length > 0 ? (
                            <>
                              {(showAllTxt ? dnsData.dns.txt : dnsData.dns.txt.slice(0, 3)).map((txt, index) => (
                                <div key={index} className="group">
                                  <div className="flex items-start justify-between">
                                    <div className="text-slate-800 font-mono text-xs bg-white rounded-lg px-3 py-2 border flex-1 mr-2 break-all">
                                      {txt.length > 150 ? `${txt.substring(0, 150)}...` : txt}
                                    </div>
                                    <button 
                                      onClick={() => copyToClipboard(txt)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded"
                                    >
                                      <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {dnsData.dns.txt.length > 3 && (
                                <div className="text-center pt-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAllTxt(!showAllTxt)}
                                    className="text-palette-primary hover:text-palette-primary hover:bg-palette-accent-3"
                                  >
                                    {showAllTxt ? (
                                      <>{t('dns.showLess')}</>
                                    ) : (
                                      <>{t('dns.showAllTxt', { count: dnsData.dns.txt.length })}</>
                                    )}
                                  </Button>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-slate-400 text-xs text-center py-2 bg-white/50 rounded border border-dashed">{t('dns.none')}</div>
                          )}
                        </div>
                      </div>

                    {/* 5. SOA Records - Always show */}
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl p-5 border border-indigo-200/50">
                        <div className="flex items-center gap-2 mb-4">
                          <Clock className="h-5 w-5 text-indigo-600" />
                          <h4 className="font-semibold text-slate-800">{t('dns.soaRecords')}</h4>
                          <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 px-2 py-1 text-xs">
                            {t('dns.record', { count: dnsData.dns.soa ? 1 : 0 })}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {dnsData.dns.soa ? (
                            <>
                              <div className="flex items-center justify-between group">
                                <div className="text-slate-800 font-mono text-sm bg-white rounded-lg px-3 py-2 border flex-1 mr-2">
                                  <span className="text-slate-600 text-xs">{t('dns.primaryNs')}:</span> {dnsData.dns.soa.nsname}
                                </div>
                                <button 
                                  onClick={() => copyToClipboard(dnsData.dns.soa?.nsname || '')}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded"
                                >
                                  <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                                </button>
                              </div>
                              <div className="flex items-center justify-between group">
                                <div className="text-slate-800 font-mono text-sm bg-white rounded-lg px-3 py-2 border flex-1 mr-2">
                                  <span className="text-slate-600 text-xs">{t('dns.hostmaster')}:</span> {dnsData.dns.soa.hostmaster}
                                </div>
                                <button 
                                  onClick={() => copyToClipboard(dnsData.dns.soa?.hostmaster || '')}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded"
                                >
                                  <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                                </button>
                              </div>
                              <div className="flex items-center justify-between group">
                                <div className="text-slate-800 font-mono text-sm bg-white rounded-lg px-3 py-2 border flex-1 mr-2">
                                  <span className="text-slate-600 text-xs">{t('dns.serial')}:</span> {dnsData.dns.soa.serial} | <span className="text-slate-600 text-xs">{t('dns.refresh')}:</span> {t('dns.seconds', { seconds: dnsData.dns.soa.refresh })}
                                </div>
                                <button 
                                  onClick={() => copyToClipboard(`${dnsData.dns.soa?.serial || ''} ${dnsData.dns.soa?.refresh || ''}`)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded"
                                >
                                  <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="text-slate-400 text-xs text-center py-2 bg-white/50 rounded border border-dashed">{t('dns.none')}</div>
                          )}
                        </div>
                      </div>

                    {/* 6. CNAME Records - Always show */}
                    <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-xl p-5 border border-pink-200/50">
                      <div className="flex items-center gap-2 mb-4">
                        <Globe className="h-5 w-5 text-pink-600" />
                        <h4 className="font-semibold text-slate-800">{t('dns.cnameRecords')}</h4>
                        <Badge className="bg-pink-100 text-pink-800 border-pink-200 px-2 py-1 text-xs">
                          {t('dns.records', { count: dnsData.dns.cname.length })}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {dnsData.dns.cname.length > 0 ? (
                          dnsData.dns.cname.map((cname, index) => (
                            <div key={index} className="flex items-center justify-between group">
                              <div className="text-slate-800 font-mono text-sm bg-white rounded-lg px-3 py-2 border flex-1 mr-2">
                                {cname}
                              </div>
                              <button 
                                onClick={() => copyToClipboard(cname)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded"
                              >
                                <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-400 text-xs text-center py-2 bg-white/50 rounded border border-dashed">{t('dns.none')}</div>
                        )}
                      </div>
                    </div>

                    {/* 7. SRV Records - Always show */}
                    <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-xl p-5 border border-teal-200/50">
                      <div className="flex items-center gap-2 mb-4">
                        <Server className="h-5 w-5 text-teal-600" />
                        <h4 className="font-semibold text-slate-800">{t('dns.srvRecords')}</h4>
                        <Badge className="bg-teal-100 text-teal-800 border-teal-200 px-2 py-1 text-xs">
                          {t('dns.records', { count: dnsData.dns.srv.length })}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {dnsData.dns.srv.length > 0 ? (
                          dnsData.dns.srv.map((srv, index) => (
                            <div key={index} className="group">
                              <div className="flex items-center justify-between mb-1">
                                <div className="text-slate-800 font-mono text-sm bg-white rounded-lg px-3 py-2 border flex-1 mr-2">
                                  <span className="text-slate-600 text-xs">{t('dns.service')}:</span> {srv.name}
                                </div>
                                <button 
                                  onClick={() => copyToClipboard(srv.name)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded"
                                >
                                  <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                                </button>
                              </div>
                              <div className="flex items-center justify-between mb-1">
                                <div className="text-slate-800 font-mono text-sm bg-white rounded-lg px-3 py-2 border flex-1 mr-2">
                                  <span className="text-slate-600 text-xs">{t('dns.target')}:</span> {srv.target}:{srv.port}
                                </div>
                                <button 
                                  onClick={() => copyToClipboard(`${srv.target}:${srv.port}`)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded"
                                >
                                  <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                                </button>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="text-slate-800 font-mono text-sm bg-white rounded-lg px-3 py-2 border flex-1 mr-2">
                                  <span className="text-slate-600 text-xs">{t('dns.priority')}:</span> {srv.priority} | <span className="text-slate-600 text-xs">{t('dns.weight')}:</span> {srv.weight}
                                </div>
                                <button 
                                  onClick={() => copyToClipboard(`${srv.priority} ${srv.weight}`)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded"
                                >
                                  <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-400 text-xs text-center py-2 bg-white/50 rounded border border-dashed">{t('dns.none')}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          )}

          {/* Features Section - Show when no results */}
          {!dnsData && (
            <div className="grid md:grid-cols-3 gap-8 justify-items-center">
              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Server className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-slate-800">{t('dns.allRecordTypes')}</h3>
                    <p className="text-slate-600 mb-4">
                      {t('dns.allRecordTypesDesc')}
                    </p>
                    <ul className="space-y-2 text-sm text-slate-500">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('dns.aAaaaMxTxt')}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('dns.nsSoaCname')}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('dns.srvForServices')}
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
                      <Clock className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-slate-800">{t('dns.instantAnalysis')}</h3>
                    <p className="text-slate-600 mb-4">
                      {t('dns.instantAnalysisDesc')}
                    </p>
                    <ul className="space-y-2 text-sm text-slate-500">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('dns.realtimeResolution')}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('dns.multipleDnsServers')}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('dns.instantResults')}
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
                      <Copy className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-slate-800">{t('dns.easyManagement')}</h3>
                    <p className="text-slate-600 mb-4">
                      {t('dns.easyManagementDesc')}
                    </p>
                    <ul className="space-y-2 text-sm text-slate-500">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('dns.oneClickCopy')}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('dns.cleanDisplay')}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('dns.emptyStateIndicators')}
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Call to Action Section - Only show after results */}
          {dnsData && (
            <ConsultationCTA
              title={t('dns.ctaTitle')}
              description={t('dns.ctaDescription')}
              secondaryButtonHref="/dns-info"
            />
          )}
        </div>
      </div>
    </div>
  )
}