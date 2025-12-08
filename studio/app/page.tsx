"use client";
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Clock, FileText, TrendingUp, Shield, BarChart3, Globe, Sparkles, ArrowRight, CheckCircle, Star, Play, Users, Award, Target, Rocket, Activity, Eye, Monitor, Server, Lock, Network, Code, Link2, Type, Tag, Percent, Calendar, X } from "lucide-react"
import { getDjangoApiUrl } from "@/lib/api-config";

export default function HomePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [featuredDeal, setFeaturedDeal] = useState<any>(null);

  useEffect(() => {
    // Mark as mounted to prevent hydration mismatch
    setMounted(true);
    
    // Fetch featured deal
    fetch(getDjangoApiUrl('/api/deals/featured/'))
      .then(res => res.json())
      .then(data => {
        if (data.has_deal && data.deal) {
          setFeaturedDeal(data.deal);
        }
      })
      .catch(err => {
        console.error('Error fetching featured deal:', err);
      });
    
    // Check if user is logged in and redirect to dashboard
    const token = localStorage.getItem("access_token");
    if (token) {
      // Validate token by checking user info
      fetch(getDjangoApiUrl('/api/user-info/'), {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          if (res.ok) {
            return res.json();
          }
          throw new Error('Invalid token');
        })
        .then(data => {
          // If email is verified, redirect to workspace (unified dashboard)
          if (data.email_verified !== false) {
            router.push("/workspace");
          }
        })
        .catch(() => {
          // Token is invalid, clear it and stay on homepage
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        });
    }
  }, [router]);
  return (
    <div className="min-h-screen overflow-x-hidden" suppressHydrationWarning>
      {/* Hero Section - Uses Palette Colors */}
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
              <Rocket className="h-4 w-4 mr-2" />
              {t('homepage.heroBadge')}
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            {t('homepage.heroTitle')}
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto mb-8 leading-relaxed">
            {t('homepage.heroDescription')} <span className="text-white font-semibold">{t('homepage.lightningFast')}</span>, 
            <span className="text-white/90 font-semibold"> {t('homepage.aiPowered')}</span>, and 
            <span className="text-white/95 font-semibold"> {t('homepage.actionable')}</span>.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              {t('homepage.loadTime')}
            </div>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              {t('homepage.pageSize')}
            </div>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              {t('homepage.requests')}
            </div>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              {t('homepage.coreWebVitals')}
            </div>
      </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
            <Button size="lg" className="bg-palette-primary hover:bg-palette-primary-hover text-white border-0 px-8 py-4 text-lg font-semibold rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300" asChild>
              <Link href="/performance">
                <Play className="mr-2 h-5 w-5" />
                {t('homepage.analyzeNow')}
              </Link>
            </Button>
            <Button size="lg" className="bg-white/20 text-white border border-white/30 hover:bg-white/30 px-8 py-4 text-lg rounded-xl backdrop-blur-sm font-semibold">
              <Eye className="mr-2 h-5 w-5" />
              {t('homepage.watchDemo')}
            </Button>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-8 text-white/80">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <span className="font-medium">{t('homepage.noCreditCard')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <span className="font-medium">{t('homepage.instantResults')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <span className="font-medium">{t('homepage.enterpriseGrade')}</span>
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

      {/* Marketing Banner - Limited Time Deal */}
      <section className="py-12 px-4" style={{ backgroundColor: 'var(--theme-bg-tertiary)' }}>
        <div className="container mx-auto max-w-7xl">
          <div className="bg-white rounded-xl shadow-lg border-2 border-palette-primary/20 p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Left Side - Badge and Title */}
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2 bg-gradient-to-r from-palette-primary to-palette-secondary text-white px-4 py-2 rounded-full shadow-md">
                  <Tag className="h-5 w-5" />
                  <span className="font-bold text-sm md:text-base">{t('homepage.limitedTimeDeal')}</span>
                </div>
                <div className="hidden md:block h-8 w-px bg-palette-accent-2"></div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                    {t('homepage.analystPackage')}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                    {t('homepage.validUntil')}
                  </p>
                </div>
              </div>

              {/* Center - Pricing */}
              <div className="flex items-center gap-4 flex-wrap justify-center">
                <div className="text-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl md:text-3xl font-bold line-through opacity-50" style={{ color: 'var(--theme-text-secondary)' }}>
                      $359.88
                    </span>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-semibold">
                      $29.99/mo × 12
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--color-primary)' }}>
                      $199
                    </span>
                    <span className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                      {t('homepage.perYear')}
                    </span>
                  </div>
                </div>
                <div className="hidden md:block h-12 w-px bg-palette-accent-2"></div>
                <div className="text-center">
                  <div className="flex items-center gap-2 mb-1">
                    <Percent className="h-5 w-5 text-green-600" />
                    <span className="text-2xl md:text-3xl font-bold text-green-600">
                      44%
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-green-600">{t('homepage.savings')}</p>
                </div>
              </div>

              {/* Right Side - CTA Button */}
              <div className="flex-shrink-0">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-palette-primary to-palette-secondary hover:from-palette-primary-hover hover:to-palette-secondary-hover text-white px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  asChild
                >
                  <Link href={featuredDeal ? `/checkout?deal=${featuredDeal.slug}` : '/upgrade'}>
                    {t('homepage.claimDeal')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Additional Info Bar */}
            <div className="mt-6 pt-6 border-t border-palette-accent-2/50">
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm mb-4" style={{ color: 'var(--theme-text-secondary)' }}>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{t('homepage.valid')}: {t('homepage.validUntil')}</span>
                </div>
                <div className="hidden md:block">•</div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>{t('homepage.cancelAnytime')}</span>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium" style={{ color: 'var(--theme-text-primary)' }}>{t('homepage.allToolsIncluded')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium" style={{ color: 'var(--theme-text-primary)' }}>{t('homepage.testAllTools')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium" style={{ color: 'var(--theme-text-primary)' }}>{t('homepage.monitor100Sites')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Premium Design */}
      <section className="py-32 px-4 bg-gradient-to-br from-slate-50 to-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,rgba(120,119,198,0.1),transparent)]"></div>
        
        <div className="container mx-auto max-w-7xl relative z-10 px-4">
          <div className="text-center mb-20">
            <Badge variant="outline" className="mb-6 px-4 py-2 border-palette-accent-2 text-palette-primary">
              <Target className="h-4 w-4 mr-2" />
              {t('homepage.professionalTools')}
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              {t('homepage.everythingYouNeed')}
              <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-palette-primary to-palette-secondary bg-clip-text text-transparent">{t('homepage.optimizeYourWebsite')}</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              {t('homepage.comprehensivePlatform')}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16 justify-items-center">
            {/* Feature 1 - Enhanced */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-primary to-palette-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Activity className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">{t('homepage.performanceMonitoring')}</h3>
                  <p className="text-slate-600 mb-4">
                    {t('homepage.performanceDesc')}
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('homepage.performanceVitals')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('homepage.uptimeMonitoring')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('homepage.realTimeTracking')}
                    </li>
                  </ul>
                </div>
              </CardContent>
        </Card>

            {/* Feature 2 - Enhanced */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-primary to-palette-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">{t('homepage.securityInfrastructure')}</h3>
                  <p className="text-slate-600 mb-4">
                    {t('homepage.securityDesc')}
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('homepage.sslAnalysis')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('homepage.dnsReview')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('homepage.apiTesting')}
                    </li>
                  </ul>
                </div>
              </CardContent>
        </Card>

            {/* Feature 3 - Enhanced */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-primary to-palette-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Monitor className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">{t('homepage.contentStructure')}</h3>
                  <p className="text-slate-600 mb-4">
                    {t('homepage.contentDesc')}
                  </p>
                  
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('homepage.sitemapValidation')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('homepage.brokenLinkDetection')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('homepage.typographyAnalysis')}
                    </li>
                  </ul>
                </div>
              </CardContent>
        </Card>
      </div>

          {/* Additional Premium Features Row */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all duration-300 h-full flex flex-col justify-center">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-primary to-palette-secondary flex items-center justify-center mx-auto mb-4">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
              <h4 className="font-semibold text-slate-800 mb-2">{t('homepage.globalTesting')}</h4>
              <p className="text-sm text-slate-600">{t('homepage.testFromLocations')}</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all duration-300 h-full flex flex-col justify-center">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-primary to-palette-secondary flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
              <h4 className="font-semibold text-slate-800 mb-2">{t('homepage.securityScan')}</h4>
              <p className="text-sm text-slate-600">{t('homepage.vulnerabilityDetection')}</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all duration-300 h-full flex flex-col justify-center">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-primary to-palette-secondary flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-white" />
                  </div>
              <h4 className="font-semibold text-slate-800 mb-2">{t('homepage.teamSharing')}</h4>
              <p className="text-sm text-slate-600">{t('homepage.collaborateTeam')}</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/50 hover:bg-white/80 transition-all duration-300 h-full flex flex-col justify-center">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-palette-primary to-palette-secondary flex items-center justify-center mx-auto mb-4">
                    <Award className="h-6 w-6 text-white" />
                  </div>
              <h4 className="font-semibold text-slate-800 mb-2">{t('homepage.expertSupport')}</h4>
              <p className="text-sm text-slate-600">{t('homepage.optimizationHelp')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-gradient-to-br from-gray-50 to-palette-accent-3">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('homepage.seePerformance')}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('homepage.instantInsights')}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4 justify-items-center">
                <Card className="p-6 bg-white/80 backdrop-blur border-0 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('homepage.loadTime')}</p>
                      <p className="text-3xl font-bold text-palette-primary">1.2s</p>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        15% {t('homepage.faster')}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-palette-primary" />
                  </div>
                </Card>

                <Card className="p-6 bg-white/80 backdrop-blur border-0 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('performance.title')}</p>
                      <p className="text-3xl font-bold text-palette-primary">94</p>
                      <div className="flex items-center mt-1">
                        <Star className="h-3 w-3 text-yellow-500 mr-1" />
                        <span className="text-xs text-muted-foreground">{t('homepage.excellent')}</span>
                      </div>
                </div>
                    <BarChart3 className="h-8 w-8 text-palette-primary" />
              </div>
          </Card>

                <Card className="p-6 bg-white/80 backdrop-blur border-0 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('homepage.pageSize')}</p>
                      <p className="text-3xl font-bold text-palette-primary">2.1MB</p>
                      <p className="text-xs text-muted-foreground mt-1">{t('homepage.optimized')}</p>
                </div>
                    <FileText className="h-8 w-8 text-palette-primary" />
              </div>
          </Card>

                <Card className="p-6 bg-white/80 backdrop-blur border-0 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('homepage.requests')}</p>
                      <p className="text-3xl font-bold text-palette-primary">47</p>
                      <p className="text-xs text-palette-primary mt-1">{t('homepage.good')}</p>
                    </div>
                    <Globe className="h-8 w-8 text-palette-primary" />
                  </div>
                </Card>
              </div>

              <Card className="p-6 bg-white/80 backdrop-blur border-0 shadow-md">
                <h3 className="font-semibold mb-3 flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-palette-primary" />
                  {t('homepage.aiRecommendations')}
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    {t('homepage.optimizeImages')}
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    {t('homepage.enableCompression')}
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    {t('homepage.reduceJavaScript')}
                  </li>
                </ul>
              </Card>
            </div>

            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-palette-accent-3 to-palette-accent-2 rounded-2xl shadow-xl p-6">
                <div className="text-center mb-4">
                  <BarChart3 className="h-16 w-16 text-palette-primary mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-700">{t('homepage.interactiveCharts')}</p>
                  <p className="text-sm text-muted-foreground">{t('homepage.detailedAnalysis')}</p>
                </div>
                
                {/* Waterfall Chart Preview */}
                <div className="bg-white/80 backdrop-blur-sm rounded-lg border p-4">
                  <div className="text-xs text-gray-500 mb-2 font-medium">{t('homepage.resourceLoading')}</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                      <span className="text-gray-600">JS (124.9 KB) - 1.25s</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-400 h-2 rounded-full" style={{width: '62%'}}></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 bg-green-400 rounded"></div>
                      <span className="text-gray-600">CSS (123.3 KB) - 1.47s</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-400 h-2 rounded-full" style={{width: '73%'}}></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 bg-palette-accent-2 rounded"></div>
                      <span className="text-gray-600">HTML (69.4 KB) - 0.34s</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-palette-accent-2 h-2 rounded-full" style={{width: '17%'}}></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 bg-pink-400 rounded"></div>
                      <span className="text-gray-600">Font (20.9 KB) - 0.26s</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-pink-400 h-2 rounded-full" style={{width: '13%'}}></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {t('homepage.timeline')}: 0s ——————————————————————— 2s
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 mb-8 bg-white">
        <div className="container mx-auto max-w-4xl text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: 'var(--theme-text-primary)' }}>
            {t('homepage.readyToWrangle')}
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto" style={{ color: 'var(--theme-text-secondary)' }}>
            {t('homepage.joinThousands')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3" asChild>
              <Link href="/performance">
                {t('homepage.startFreeAnalysis')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-palette-primary text-palette-primary hover:bg-palette-primary hover:text-white">
              {t('homepage.viewSampleReport')}
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>50K+</div>
              <div className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>{t('homepage.websitesAnalyzed')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>99.9%</div>
              <div className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>{t('homepage.uptimeGuarantee')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>&lt; 30s</div>
              <div className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>{t('homepage.averageAnalysisTime')}</div>
            </div>
        </div>
      </div>
      </section>
    </div>
  )
}