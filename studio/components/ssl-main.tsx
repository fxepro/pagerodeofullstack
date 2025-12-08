"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useSslAnalysis } from "@/hooks/use-ssl-analysis"
import { useTranslation } from "react-i18next"
import { ErrorDisplay } from "@/components/error-display"
import { Shield, CheckCircle, AlertTriangle, XCircle, Globe, Clock, Activity, Eye, Server, Lock, Wifi, AlertCircle, Award, Zap, Key, FileText, Calendar, Users, Star, ChevronRight, Copy, ExternalLink } from "lucide-react"
import { ConsultationCTA } from "@/components/consultation-cta"

interface SslData {
  domain: string
  ssl: {
    valid: boolean
    issuer: string
    validFrom: string
    validTo: string
    daysUntilExpiry: number
    protocol: string
    cipher: string
    keySize: number
    subject?: string
    serialNumber?: string
    fingerprint?: string
    altNames?: string[]
  }
  dns: {
    ipv4: string[]
    ipv6: string[]
    mx: string[]
    txt: string[]
    ns: string[]
  }
  domain_info: {
    registrar: string
    created: string
    expires: string
    daysUntilExpiry: number
    status: string[]
  }
  security: {
    hsts: boolean
    redirectsToHttps: boolean
    mixedContent: boolean
    securityHeaders: string[]
  }
}

interface SslMainProps {
  url?: string;
}

export function SslMain({ url: initialUrl = "" }: SslMainProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { url, setUrl, isChecking, sslData, handleCheck, error, isRetrying, clearError } = useSslAnalysis({ initialUrl, autoRun: !!initialUrl })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getExpiryColor = (days: number) => {
    if (days < 7) return "text-red-600"
    if (days < 30) return "text-yellow-600"
    return "text-green-600"
  }

  const getExpiryBadgeColor = (days: number) => {
    if (days < 7) return "bg-red-100 text-red-800 border-red-200"
    if (days < 30) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-green-100 text-green-800 border-green-200"
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: t('ssl.copiedToClipboard'),
      description: t('ssl.copiedToClipboardDesc'),
    })
  }

  // When used in Site Audit (has initialUrl), show ONLY results
  if (initialUrl) {
    if (isChecking) {
      return (
        <div className="p-6">
          <div className="text-center py-8">
            <Activity className="animate-spin h-12 w-12 text-palette-primary mx-auto mb-4" />
            <p className="text-slate-600">{t('ssl.checkingFor', { url: initialUrl })}</p>
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

    if (!sslData) return null;

    return (
      <div className="p-6">
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-palette-accent-2/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Shield className="h-6 w-6 text-palette-primary" />
                  {t('ssl.sslDomainAnalysisFor', { domain: sslData.domain })}
                </h2>
                <p className="text-slate-600 mt-1">
                  {t('ssl.comprehensiveSecurity')}
                </p>
              </div>
              <Button
                onClick={handleCheck}
                disabled={isChecking}
                variant="outline"
                className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
              >
                <Activity className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                {t('ssl.recheck')}
              </Button>
            </div>
          </div>

          {/* SSL Certificate Section */}
          <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-palette-accent-3/30">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl w-fit transition-all duration-300 ${sslData.ssl.valid ? 'bg-gradient-to-br from-green-100 to-green-200 shadow-green-200/50 shadow-lg' : 'bg-gradient-to-br from-red-100 to-red-200 shadow-red-200/50 shadow-lg'}`}>
                    {sslData.ssl.valid ? (
                      <Shield className="h-7 w-7 text-green-700" />
                    ) : (
                      <AlertTriangle className="h-7 w-7 text-red-700" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-slate-800 text-xl">{t('ssl.sslCertificate')}</CardTitle>
                      <Badge className={`${sslData.ssl.valid ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'} px-3 py-1 text-xs font-medium`}>
                        {sslData.ssl.valid ? t('ssl.valid') : t('ssl.invalid')}
                      </Badge>
                    </div>
                    <CardDescription className="text-slate-600 mt-1">
                      {sslData.ssl.valid ? t('ssl.certificateValid') : t('ssl.certificateIssues')}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={`${getExpiryBadgeColor(sslData.ssl.daysUntilExpiry)} px-3 py-1 text-sm font-semibold border`}>
                  <Calendar className="h-3 w-3 mr-1" />
                  {sslData.ssl.daysUntilExpiry} days
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Certificate Information */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-5 border border-slate-200/50">
                    <div className="flex items-center gap-2 mb-4">
                      <Award className="h-5 w-5 text-palette-primary" />
                      <h4 className="font-semibold text-slate-800">{t('ssl.certificateAuthority')}</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="group">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 text-sm">{t('ssl.issuer')}</span>
                          <button 
                            onClick={() => copyToClipboard(sslData.ssl.issuer)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                          </button>
                        </div>
                        <div className="text-slate-800 font-medium mt-1 bg-white rounded-lg px-3 py-2 border">
                          {sslData.ssl.issuer}
                        </div>
                      </div>
                      {sslData.ssl.subject && (
                        <div className="group">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 text-sm">Subject</span>
                            <button 
                              onClick={() => copyToClipboard(sslData.ssl.subject!)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                            </button>
                          </div>
                          <div className="text-slate-800 font-medium mt-1 bg-white rounded-lg px-3 py-2 border text-sm">
                            {sslData.ssl.subject}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200/50">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-slate-800">{t('ssl.validityPeriod')}</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-sm">{t('ssl.validFrom')}</span>
                        <span className="text-slate-800 bg-white rounded-lg px-3 py-1 border text-sm">
                          {formatDate(sslData.ssl.validFrom)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-sm">{t('ssl.validTo')}</span>
                        <span className="text-slate-800 bg-white rounded-lg px-3 py-1 border text-sm">
                          {formatDate(sslData.ssl.validTo)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-sm">{t('ssl.daysRemaining')}</span>
                        <Badge className={`${getExpiryBadgeColor(sslData.ssl.daysUntilExpiry)} px-3 py-1 text-sm font-semibold`}>
                          <Clock className="h-3 w-3 mr-1" />
                          {sslData.ssl.daysUntilExpiry}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technical Details */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-5 border border-green-200/50">
                    <div className="flex items-center gap-2 mb-4">
                      <Key className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-slate-800">{t('ssl.encryptionDetails')}</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-sm">{t('ssl.protocol')}</span>
                        <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1 text-sm font-medium">
                          <Zap className="h-3 w-3 mr-1" />
                          {sslData.ssl.protocol}
                        </Badge>
                      </div>
                      <div className="group">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 text-sm">{t('ssl.cipherSuite')}</span>
                          <button 
                            onClick={() => copyToClipboard(sslData.ssl.cipher)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                          </button>
                        </div>
                        <div className="text-slate-800 font-mono text-xs mt-1 bg-white rounded-lg px-3 py-2 border break-all">
                          {sslData.ssl.cipher}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-sm">Key Size</span>
                        <Badge className="bg-white text-slate-800 border px-3 py-1 text-sm font-semibold">
                          {sslData.ssl.keySize} bits
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Certificate Identifiers */}
                  <div className="bg-gradient-to-br from-palette-accent-3 to-palette-accent-3/50 rounded-xl p-5 border border-palette-accent-2/50">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="h-5 w-5 text-palette-primary" />
                      <h4 className="font-semibold text-slate-800">{t('ssl.certificateIdentifiers')}</h4>
                    </div>
                    <div className="space-y-3">
                      {sslData.ssl.serialNumber && (
                        <div className="group">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 text-sm">{t('ssl.serialNumber')}</span>
                            <button 
                              onClick={() => copyToClipboard(sslData.ssl.serialNumber!)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                            </button>
                          </div>
                          <div className="text-slate-800 font-mono text-xs mt-1 bg-white rounded-lg px-3 py-2 border">
                            {sslData.ssl.serialNumber}
                          </div>
                        </div>
                      )}
                      {sslData.ssl.fingerprint && (
                        <div className="group">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 text-sm">SHA1 Fingerprint</span>
                            <button 
                              onClick={() => copyToClipboard(sslData.ssl.fingerprint!)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                            </button>
                          </div>
                          <div className="text-slate-800 font-mono text-xs mt-1 bg-white rounded-lg px-3 py-2 border break-all">
                            {sslData.ssl.fingerprint}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Alternative Names */}
                  {sslData.ssl.altNames && sslData.ssl.altNames.length > 0 && (
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-5 border border-orange-200/50">
                      <div className="flex items-center gap-2 mb-4">
                        <Globe className="h-5 w-5 text-orange-600" />
                        <h4 className="font-semibold text-slate-800">{t('ssl.alternativeNames')}</h4>
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200 px-2 py-1 text-xs">
                          {t('ssl.domains', { count: sslData.ssl.altNames.length })}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {sslData.ssl.altNames.slice(0, 6).map((name, index) => (
                          <div key={index} className="flex items-center justify-between group">
                            <div className="text-slate-800 font-mono text-sm bg-white rounded-lg px-3 py-2 border flex-1 mr-2">
                              {name}
                            </div>
                            <button 
                              onClick={() => copyToClipboard(name)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white rounded"
                            >
                              <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                            </button>
                          </div>
                        ))}
                        {sslData.ssl.altNames.length > 6 && (
                          <div className="text-slate-500 text-sm text-center pt-2">
                            {t('ssl.andMoreDomains', { count: sslData.ssl.altNames.length - 6 })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Domain & Security Section */}
          <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-palette-accent-3/30">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl w-fit shadow-purple-200/50 shadow-lg">
                    <Globe className="h-7 w-7 text-palette-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-slate-800 text-xl">{t('ssl.domainSecurity')}</CardTitle>
                    <CardDescription className="text-slate-600 mt-1">
                      {t('ssl.registrationDetails')}
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-palette-accent-3 text-purple-800 border-palette-accent-2 px-3 py-1 text-sm font-medium">
                  <Shield className="h-3 w-3 mr-1" />
                  {t('ssl.secured')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Domain Registration */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-palette-accent-3 to-palette-accent-3/50 rounded-xl p-5 border border-palette-accent-2/50">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="h-5 w-5 text-palette-primary" />
                      <h4 className="font-semibold text-slate-800">{t('ssl.domainRegistration')}</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="group">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 text-sm">{t('ssl.registrar')}</span>
                          <button 
                            onClick={() => copyToClipboard(sslData.domain_info.registrar)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                          </button>
                        </div>
                        <div className="text-slate-800 font-medium mt-1 bg-white rounded-lg px-3 py-2 border">
                          {sslData.domain_info.registrar}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-sm">{t('ssl.registrationDate')}</span>
                        <span className="text-slate-800 bg-white rounded-lg px-3 py-1 border text-sm">
                          {formatDate(sslData.domain_info.created)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-sm">{t('ssl.expiryDate')}</span>
                        <span className="text-slate-800 bg-white rounded-lg px-3 py-1 border text-sm">
                          {formatDate(sslData.domain_info.expires)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 text-sm">{t('ssl.daysUntilExpiry')}</span>
                        <Badge className={`${getExpiryBadgeColor(sslData.domain_info.daysUntilExpiry)} px-3 py-1 text-sm font-semibold`}>
                          <Calendar className="h-3 w-3 mr-1" />
                          {sslData.domain_info.daysUntilExpiry}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Domain Status */}
                  {sslData.domain_info.status.length > 0 && (
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-5 border border-slate-200/50">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="h-5 w-5 text-slate-600" />
                        <h4 className="font-semibold text-slate-800">{t('ssl.domainStatus')}</h4>
                        <Badge className="bg-slate-100 text-slate-800 border-slate-200 px-2 py-1 text-xs">
                          {t('ssl.flags', { count: sslData.domain_info.status.length })}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {sslData.domain_info.status.map((status, index) => (
                          <div key={index} className="flex items-center justify-between group">
                            <div className="text-slate-800 font-mono text-sm bg-white rounded-lg px-3 py-2 border flex-1 mr-2">
                              {status}
                            </div>
                            <button 
                              onClick={() => copyToClipboard(status)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white rounded"
                            >
                              <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Security Configuration */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-5 border border-green-200/50">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-slate-800">{t('ssl.securityFeatures')}</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {sslData.security.hsts ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <span className="text-slate-700 font-medium">{t('ssl.hstsEnabled')}</span>
                        </div>
                        <Badge className={`${sslData.security.hsts ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'} px-2 py-1 text-xs`}>
                          {sslData.security.hsts ? t('ssl.active') : t('ssl.disabled')}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {sslData.security.redirectsToHttps ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <span className="text-slate-700 font-medium">{t('ssl.httpsRedirect')}</span>
                        </div>
                        <Badge className={`${sslData.security.redirectsToHttps ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'} px-2 py-1 text-xs`}>
                          {sslData.security.redirectsToHttps ? t('ssl.enabled') : t('ssl.disabled')}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {!sslData.security.mixedContent ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          )}
                          <span className="text-slate-700 font-medium">{t('ssl.mixedContent')}</span>
                        </div>
                        <Badge className={`${!sslData.security.mixedContent ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'} px-2 py-1 text-xs`}>
                          {!sslData.security.mixedContent ? t('ssl.secure') : t('ssl.warning')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Security Headers */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200/50">
                    <div className="flex items-center gap-2 mb-4">
                      <Lock className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-slate-800">{t('ssl.securityHeaders')}</h4>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-2 py-1 text-xs">
                        {t('ssl.headers', { count: sslData.security.securityHeaders.length })}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {sslData.security.securityHeaders.length > 0 ? (
                        sslData.security.securityHeaders.map((header, index) => (
                          <div key={index} className="flex items-center justify-between group">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <div className="text-slate-800 font-mono text-sm bg-white rounded-lg px-3 py-2 border flex-1">
                                {header}
                              </div>
                            </div>
                            <button 
                              onClick={() => copyToClipboard(header)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white rounded ml-2"
                            >
                              <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500 text-sm text-center py-4 bg-white rounded-lg border border-dashed">
                          <AlertTriangle className="h-4 w-4 mx-auto mb-2 text-yellow-500" />
                          {t('ssl.noSecurityHeaders')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Security Score */}
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl p-5 border border-yellow-200/50">
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="h-5 w-5 text-yellow-600" />
                      <h4 className="font-semibold text-slate-800">{t('ssl.securityScore')}</h4>
                    </div>
                    <div className="text-center">
                      {(() => {
                        const score = (
                          (sslData.security.hsts ? 25 : 0) +
                          (sslData.security.redirectsToHttps ? 25 : 0) +
                          (!sslData.security.mixedContent ? 25 : 0) +
                          (sslData.security.securityHeaders.length > 0 ? 25 : 0)
                        );
                        const scoreColor = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600';
                        const scoreBg = score >= 75 ? 'bg-green-100 border-green-200' : score >= 50 ? 'bg-yellow-100 border-yellow-200' : 'bg-red-100 border-red-200';
                        
                        return (
                          <>
                            <div className={`text-4xl font-bold ${scoreColor} mb-2`}>
                              {score}%
                            </div>
                            <Badge className={`${scoreBg} px-4 py-2 text-sm font-medium`}>
                              {score >= 75 ? t('ssl.excellent') : score >= 50 ? t('ssl.good') : t('ssl.needsImprovement')}
                            </Badge>
                            <div className="text-slate-600 text-xs mt-2">
                              {t('ssl.scoreBasedOn')}
                            </div>
                          </>
                        );
                      })()}
                    </div>
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
      {/* Hero Section - Only show on standalone page */}
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
              <Shield className="h-4 w-4 mr-2" />
              {t('ssl.heroBadge')}
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('ssl.heroTitle')}
          </h1>
          
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
            {t('ssl.heroDescription')}
          </p>

          {/* URL Input Section - Glassmorphism style */}
          <div className="w-full max-w-4xl mx-auto">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  id="ssl-domain"
                  type="text"
                  placeholder={t('ssl.urlPlaceholder')}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
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
                      <Activity className="h-5 w-5 mr-2 animate-spin" />
                      {t('ssl.checking')}
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      {t('ssl.analyze')}
                    </>
                  )}
              </Button>
              </div>
            </div>
            
            <p className="text-center text-white/80 mt-4 text-sm">
              {t('ssl.helperText')}
            </p>
          </div>
        </div>
      </section>
      )}

      {/* Error Display for Standalone Page */}
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
          {/* Features Section */}
          {!sslData && (
            <div className="grid md:grid-cols-3 gap-8 justify-items-center">
              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Lock className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-slate-800">{t('ssl.sslCertificateFeature')}</h3>
                    <p className="text-slate-600 mb-4">
                      {t('ssl.sslCertificateDesc')}
                    </p>
                    <ul className="space-y-2 text-sm text-slate-500">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('ssl.certificateValidity')}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('ssl.issuerChainValidation')}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('ssl.encryptionStrength')}
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
                      <Globe className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-slate-800">{t('ssl.domainInfo')}</h3>
                    <p className="text-slate-600 mb-4">
                      {t('ssl.domainInfoDesc')}
                    </p>
                    <ul className="space-y-2 text-sm text-slate-500">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('ssl.registrationExpiryDates')}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('ssl.securityHeadersAnalysis')}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {t('ssl.httpsHstsStatus')}
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results Section */}
          {sslData && (
            <div className="space-y-8">
              {/* Header */}
              <div className="bg-white rounded-lg shadow-lg p-6 border border-palette-accent-2/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                      <Shield className="h-6 w-6 text-palette-primary" />
                      {t('ssl.sslDomainAnalysisFor', { domain: sslData.domain })}
                    </h2>
                    <p className="text-slate-600 mt-1">
                      {t('ssl.comprehensiveSecurity')}
                    </p>
                  </div>
                  <Button
                    onClick={handleCheck}
                    disabled={isChecking}
                    variant="outline"
                    className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
                  >
                    <Activity className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                    {t('ssl.recheck')}
                  </Button>
                </div>
              </div>

              {/* SSL Certificate Section */}
              <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-palette-accent-3/30">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl w-fit transition-all duration-300 ${sslData.ssl.valid ? 'bg-gradient-to-br from-green-100 to-green-200 shadow-green-200/50 shadow-lg' : 'bg-gradient-to-br from-red-100 to-red-200 shadow-red-200/50 shadow-lg'}`}>
                        {sslData.ssl.valid ? (
                          <Shield className="h-7 w-7 text-green-700" />
                        ) : (
                          <AlertTriangle className="h-7 w-7 text-red-700" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-slate-800 text-xl">SSL Certificate</CardTitle>
                          <Badge className={`${sslData.ssl.valid ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'} px-3 py-1 text-xs font-medium`}>
                            {sslData.ssl.valid ? 'VALID' : 'INVALID'}
                          </Badge>
                        </div>
                        <CardDescription className="text-slate-600 mt-1">
                          {sslData.ssl.valid ? "Certificate is valid and secure" : "Certificate issues detected"}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={`${getExpiryBadgeColor(sslData.ssl.daysUntilExpiry)} px-3 py-1 text-sm font-semibold border`}>
                      <Calendar className="h-3 w-3 mr-1" />
                      {t('ssl.days', { days: sslData.ssl.daysUntilExpiry })}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Certificate Information */}
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-5 border border-slate-200/50">
                        <div className="flex items-center gap-2 mb-4">
                          <Award className="h-5 w-5 text-palette-primary" />
                          <h4 className="font-semibold text-slate-800">{t('ssl.certificateAuthority')}</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="group">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600 text-sm">{t('ssl.issuer')}</span>
                              <button 
                                onClick={() => copyToClipboard(sslData.ssl.issuer)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                              </button>
                            </div>
                            <div className="text-slate-800 font-medium mt-1 bg-white rounded-lg px-3 py-2 border">
                              {sslData.ssl.issuer}
                            </div>
                          </div>
                          {sslData.ssl.subject && (
                            <div className="group">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600 text-sm">{t('ssl.subject')}</span>
                                <button 
                                  onClick={() => copyToClipboard(sslData.ssl.subject!)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                                </button>
                              </div>
                              <div className="text-slate-800 font-medium mt-1 bg-white rounded-lg px-3 py-2 border text-sm">
                                {sslData.ssl.subject}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200/50">
                        <div className="flex items-center gap-2 mb-4">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          <h4 className="font-semibold text-slate-800">{t('ssl.validityPeriod')}</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 text-sm">{t('ssl.validFrom')}</span>
                            <span className="text-slate-800 bg-white rounded-lg px-3 py-1 border text-sm">
                              {formatDate(sslData.ssl.validFrom)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 text-sm">{t('ssl.validTo')}</span>
                            <span className="text-slate-800 bg-white rounded-lg px-3 py-1 border text-sm">
                              {formatDate(sslData.ssl.validTo)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 text-sm">{t('ssl.daysRemaining')}</span>
                            <Badge className={`${getExpiryBadgeColor(sslData.ssl.daysUntilExpiry)} px-3 py-1 text-sm font-semibold`}>
                              <Clock className="h-3 w-3 mr-1" />
                              {sslData.ssl.daysUntilExpiry}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Technical Details */}
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-5 border border-green-200/50">
                        <div className="flex items-center gap-2 mb-4">
                          <Key className="h-5 w-5 text-green-600" />
                          <h4 className="font-semibold text-slate-800">{t('ssl.encryptionDetails')}</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 text-sm">{t('ssl.protocol')}</span>
                            <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1 text-sm font-medium">
                              <Zap className="h-3 w-3 mr-1" />
                              {sslData.ssl.protocol}
                            </Badge>
                          </div>
                          <div className="group">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600 text-sm">{t('ssl.cipherSuite')}</span>
                              <button 
                                onClick={() => copyToClipboard(sslData.ssl.cipher)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                              </button>
                            </div>
                            <div className="text-slate-800 font-mono text-xs mt-1 bg-white rounded-lg px-3 py-2 border break-all">
                              {sslData.ssl.cipher}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 text-sm">{t('ssl.keySize')}</span>
                            <Badge className="bg-white text-slate-800 border px-3 py-1 text-sm font-semibold">
                              {t('ssl.bits', { bits: sslData.ssl.keySize })}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Certificate Identifiers */}
                      <div className="bg-gradient-to-br from-palette-accent-3 to-palette-accent-3/50 rounded-xl p-5 border border-palette-accent-2/50">
                        <div className="flex items-center gap-2 mb-4">
                          <FileText className="h-5 w-5 text-palette-primary" />
                          <h4 className="font-semibold text-slate-800">{t('ssl.certificateIdentifiers')}</h4>
                        </div>
                        <div className="space-y-3">
                          {sslData.ssl.serialNumber && (
                            <div className="group">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600 text-sm">{t('ssl.serialNumber')}</span>
                                <button 
                                  onClick={() => copyToClipboard(sslData.ssl.serialNumber!)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                                </button>
                              </div>
                              <div className="text-slate-800 font-mono text-xs mt-1 bg-white rounded-lg px-3 py-2 border">
                                {sslData.ssl.serialNumber}
                              </div>
                            </div>
                          )}
                          {sslData.ssl.fingerprint && (
                            <div className="group">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600 text-sm">{t('ssl.sha1Fingerprint')}</span>
                                <button 
                                  onClick={() => copyToClipboard(sslData.ssl.fingerprint!)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                                </button>
                              </div>
                              <div className="text-slate-800 font-mono text-xs mt-1 bg-white rounded-lg px-3 py-2 border break-all">
                                {sslData.ssl.fingerprint}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Alternative Names */}
                      {sslData.ssl.altNames && sslData.ssl.altNames.length > 0 && (
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-5 border border-orange-200/50">
                          <div className="flex items-center gap-2 mb-4">
                            <Globe className="h-5 w-5 text-orange-600" />
                            <h4 className="font-semibold text-slate-800">{t('ssl.alternativeNames')}</h4>
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200 px-2 py-1 text-xs">
                              {t('ssl.domains', { count: sslData.ssl.altNames.length })}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {sslData.ssl.altNames.slice(0, 6).map((name, index) => (
                              <div key={index} className="flex items-center justify-between group">
                                <div className="text-slate-800 font-mono text-sm bg-white rounded-lg px-3 py-2 border flex-1 mr-2">
                                  {name}
                                </div>
                                <button 
                                  onClick={() => copyToClipboard(name)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white rounded"
                                >
                                  <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                                </button>
                              </div>
                            ))}
                            {sslData.ssl.altNames.length > 6 && (
                              <div className="text-slate-500 text-sm text-center pt-2">
                                {t('ssl.andMoreDomains', { count: sslData.ssl.altNames.length - 6 })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Domain & Security Section */}
              <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-palette-accent-3/30">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl w-fit shadow-purple-200/50 shadow-lg">
                        <Globe className="h-7 w-7 text-palette-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-slate-800 text-xl">{t('ssl.domainSecurity')}</CardTitle>
                        <CardDescription className="text-slate-600 mt-1">
                          {t('ssl.registrationDetails')}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-palette-accent-3 text-purple-800 border-palette-accent-2 px-3 py-1 text-sm font-medium">
                      <Shield className="h-3 w-3 mr-1" />
                      {t('ssl.secured')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Domain Registration */}
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-palette-accent-3 to-palette-accent-3/50 rounded-xl p-5 border border-palette-accent-2/50">
                        <div className="flex items-center gap-2 mb-4">
                          <Users className="h-5 w-5 text-palette-primary" />
                          <h4 className="font-semibold text-slate-800">{t('ssl.domainRegistration')}</h4>
                        </div>
                        <div className="space-y-4">
                          <div className="group">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600 text-sm">{t('ssl.registrar')}</span>
                              <button 
                                onClick={() => copyToClipboard(sslData.domain_info.registrar)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                              </button>
                            </div>
                            <div className="text-slate-800 font-medium mt-1 bg-white rounded-lg px-3 py-2 border">
                              {sslData.domain_info.registrar}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 text-sm">{t('ssl.registrationDate')}</span>
                            <span className="text-slate-800 bg-white rounded-lg px-3 py-1 border text-sm">
                              {formatDate(sslData.domain_info.created)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 text-sm">{t('ssl.expiryDate')}</span>
                            <span className="text-slate-800 bg-white rounded-lg px-3 py-1 border text-sm">
                              {formatDate(sslData.domain_info.expires)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 text-sm">{t('ssl.daysUntilExpiry')}</span>
                            <Badge className={`${getExpiryBadgeColor(sslData.domain_info.daysUntilExpiry)} px-3 py-1 text-sm font-semibold`}>
                              <Calendar className="h-3 w-3 mr-1" />
                              {sslData.domain_info.daysUntilExpiry}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Domain Status */}
                      {sslData.domain_info.status.length > 0 && (
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-5 border border-slate-200/50">
                          <div className="flex items-center gap-2 mb-4">
                            <FileText className="h-5 w-5 text-slate-600" />
                            <h4 className="font-semibold text-slate-800">{t('ssl.domainStatus')}</h4>
                            <Badge className="bg-slate-100 text-slate-800 border-slate-200 px-2 py-1 text-xs">
                              {t('ssl.flags', { count: sslData.domain_info.status.length })}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {sslData.domain_info.status.map((status, index) => (
                              <div key={index} className="flex items-center justify-between group">
                                <div className="text-slate-800 font-mono text-sm bg-white rounded-lg px-3 py-2 border flex-1 mr-2">
                                  {status}
                                </div>
                                <button 
                                  onClick={() => copyToClipboard(status)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white rounded"
                                >
                                  <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Security Configuration */}
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-5 border border-green-200/50">
                        <div className="flex items-center gap-2 mb-4">
                          <Shield className="h-5 w-5 text-green-600" />
                          <h4 className="font-semibold text-slate-800">{t('ssl.securityFeatures')}</h4>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {sslData.security.hsts ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                              <span className="text-slate-700 font-medium">{t('ssl.hstsEnabled')}</span>
                            </div>
                            <Badge className={`${sslData.security.hsts ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'} px-2 py-1 text-xs`}>
                              {sslData.security.hsts ? t('ssl.active') : t('ssl.disabled')}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {sslData.security.redirectsToHttps ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                              <span className="text-slate-700 font-medium">{t('ssl.httpsRedirect')}</span>
                            </div>
                            <Badge className={`${sslData.security.redirectsToHttps ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'} px-2 py-1 text-xs`}>
                              {sslData.security.redirectsToHttps ? t('ssl.enabled') : t('ssl.disabled')}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {!sslData.security.mixedContent ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                              )}
                              <span className="text-slate-700 font-medium">{t('ssl.mixedContent')}</span>
                            </div>
                            <Badge className={`${!sslData.security.mixedContent ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'} px-2 py-1 text-xs`}>
                              {!sslData.security.mixedContent ? t('ssl.secure') : t('ssl.warning')}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Security Headers */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200/50">
                        <div className="flex items-center gap-2 mb-4">
                          <Lock className="h-5 w-5 text-blue-600" />
                          <h4 className="font-semibold text-slate-800">{t('ssl.securityHeaders')}</h4>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-2 py-1 text-xs">
                            {t('ssl.headers', { count: sslData.security.securityHeaders.length })}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {sslData.security.securityHeaders.length > 0 ? (
                            sslData.security.securityHeaders.map((header, index) => (
                              <div key={index} className="flex items-center justify-between group">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <div className="text-slate-800 font-mono text-sm bg-white rounded-lg px-3 py-2 border flex-1">
                                    {header}
                                  </div>
                                </div>
                                <button 
                                  onClick={() => copyToClipboard(header)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white rounded ml-2"
                                >
                                  <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="text-slate-500 text-sm text-center py-4 bg-white rounded-lg border border-dashed">
                              <AlertTriangle className="h-4 w-4 mx-auto mb-2 text-yellow-500" />
                              {t('ssl.noSecurityHeaders')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Security Score */}
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl p-5 border border-yellow-200/50">
                        <div className="flex items-center gap-2 mb-4">
                          <Star className="h-5 w-5 text-yellow-600" />
                          <h4 className="font-semibold text-slate-800">{t('ssl.securityScore')}</h4>
                        </div>
                        <div className="text-center">
                          {(() => {
                            const score = (
                              (sslData.security.hsts ? 25 : 0) +
                              (sslData.security.redirectsToHttps ? 25 : 0) +
                              (!sslData.security.mixedContent ? 25 : 0) +
                              (sslData.security.securityHeaders.length > 0 ? 25 : 0)
                            );
                            const scoreColor = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600';
                            const scoreBg = score >= 75 ? 'bg-green-100 border-green-200' : score >= 50 ? 'bg-yellow-100 border-yellow-200' : 'bg-red-100 border-red-200';
                            
                            return (
                              <>
                                <div className={`text-4xl font-bold ${scoreColor} mb-2`}>
                                  {score}%
                                </div>
                                <Badge className={`${scoreBg} px-4 py-2 text-sm font-medium`}>
                                  {score >= 75 ? t('ssl.excellent') : score >= 50 ? t('ssl.good') : t('ssl.needsImprovement')}
                                </Badge>
                                <div className="text-slate-600 text-xs mt-2">
                                  {t('ssl.scoreBasedOn')}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Call to Action Section - Only show after results */}
          {sslData && (
            <ConsultationCTA
              title={t('ssl.ctaTitle')}
              description={t('ssl.ctaDescription')}
              secondaryButtonHref="/ssl-info"
            />
          )}
        </div>
      </div>
    </div>
  )
}
