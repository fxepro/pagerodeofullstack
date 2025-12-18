"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Check, 
  Search, 
  Users, 
  Crown, 
  Zap, 
  ArrowRight,
  Shield,
  BarChart3,
  Rocket
} from "lucide-react"

interface TierData {
  name: string
  price: string
  priceValue?: number
  tagline: string
  description: string
  icon: React.ReactNode
  color: string
  features: string[]
  idealFor: string
  ctaText: string
  ctaAction: () => void
  isHighlighted?: boolean
}

export function UpgradeContent() {

  // Pricing Plans - Sorted by Price (Ascending)
  const pricingPlans: TierData[] = [
    {
      name: "Free",
      price: "$0/mo",
      priceValue: 0,
      tagline: "Instant insights. Zero cost. A perfect starting point to understand your site.",
      description: "The Free Plan gives anyone immediate visibility into their website's core health. It's designed as a no-risk introduction, delivering essential assessments and WordPress compatibility so users can start improving their site right away.",
      icon: <Zap className="h-8 w-8" />,
      color: "#10B981",
      features: [
        "Full Site Audit – Get a comprehensive breakdown of performance, structure, errors, and technical issues",
        "Health Score Overview – Understand how your site stacks up across speed, reliability, and best practices",
        "Basic Recommendations – Actionable guidance to fix critical problems quickly",
        "WordPress Integration – Easily connect your WordPress site with one click",
        "Lightweight Dashboard – A simple control panel to track your audit results",
        "No Credit Card Required – Start instantly with zero commitment",
        "Upgrade Anytime – Seamlessly unlock advanced monitoring, AI features, and automation whenever you're ready"
      ],
      idealFor: "Perfect starting point for anyone wanting to understand their site's health at no cost.",
      ctaText: "Get Started Free",
      ctaAction: () => window.location.href = "/",
      isHighlighted: false
    },
    {
      name: "Analyst",
      price: "$29.99/mo",
      priceValue: 29.99,
      tagline: "Step into smart monitoring with deeper insights, code tracking, and intelligent alerts.",
      description: "The Analyst Plan adds intelligence to your monitoring — bringing visibility into code changes, advanced alerts, and integrations that keep you connected to what really matters.",
      icon: <BarChart3 className="h-8 w-8" />,
      color: "#8B5CF6",
      features: [
        "Everything in Free, plus:",
        "Build & Code Tracking to connect site issues with actual changes in your repository",
        "Deeper Monitoring Analytics to understand trends and hidden problems",
        "Essential Integrations (Slack, Telegram, Email, SMS, GitHub Webhooks, etc.)",
        "Developer-focused insights to speed debugging and collaboration",
        "Smart change detection to catch breakpoints early",
        "Continuous audits across performance and stability metrics",
        "More advanced alert routing across your preferred channels"
      ],
      idealFor: "Ideal for teams maintaining active websites, SaaS products, or application platforms.",
      ctaText: "Start Analyst Plan",
      ctaAction: () => handlePlanSelect("Analyst", 29.99),
      isHighlighted: true
    },
    {
      name: "Auditor",
      price: "$99/mo",
      priceValue: 99,
      tagline: "The perfect entry point for anyone who wants fast, reliable insight into their website's health.",
      description: "The Auditor Plan gives you essential visibility into how your site is performing. Get instant audits, basic monitoring, and the peace of mind that your digital presence is under watch — without any complexity or high costs.",
      icon: <Search className="h-8 w-8" />,
      color: "#3B82F6",
      features: [
        "Everything in Analyst, plus:",
        "Comprehensive Site Audit to reveal performance, security, and structural issues",
        "Ongoing Monitoring to ensure your site stays online and responsive",
        "Actionable recommendations for improving site speed and stability",
        "Alerts for basic downtime or accessibility issues",
        "Lightweight tools ideal for blogs, small business websites, and early-stage SaaS",
        "Clear reporting designed for non-technical users",
        "No long-term commitment — pay monthly, cancel anytime"
      ],
      idealFor: "Perfect low-risk starter tier to understand your site's health.",
      ctaText: "Start Auditor Plan",
      ctaAction: () => handlePlanSelect("Auditor", 99),
      isHighlighted: false
    },
    {
      name: "Manager",
      price: "$249/mo",
      priceValue: 249,
      tagline: "A powerful, AI-enhanced monitoring suite built for growing teams and mission-critical systems.",
      description: "The Manager Plan introduces AI-driven analysis, automated insights, and powerful intelligence layers that help your team prevent issues before they appear. Perfect for scaling businesses, busy software teams, and production SaaS environments.",
      icon: <Users className="h-8 w-8" />,
      color: "#F59E0B",
      features: [
        "Everything in Auditor, plus:",
        "Advanced AI Analysis of your site's performance, errors, and user experience",
        "Intelligent AI-Powered Insights that highlight root causes, anomalies, and optimizations",
        "High-frequency monitoring for production-level reliability",
        "Enhanced code audit visibility tied to performance regressions",
        "Detailed dashboards designed for engineering and IT teams",
        "Faster detection of UX failures, broken flows, and slow endpoints",
        "Predictive performance scoring based on machine learning"
      ],
      idealFor: "Great for organizations ready to scale from reactive monitoring to proactive intelligence.",
      ctaText: "Start Manager Plan",
      ctaAction: () => handlePlanSelect("Manager", 249),
      isHighlighted: false
    },
    {
      name: "Director",
      price: "$499/mo",
      priceValue: 499,
      tagline: "Enterprise-level capabilities for full-stack observability, security scanning, and automated quality assurance.",
      description: "The Director Plan gives you a comprehensive, end-to-end view of your entire digital ecosystem — including security, SaaS dependencies, UI testing, and maintenance automation. Designed for companies where uptime, security, and reliability are non-negotiable.",
      icon: <Shield className="h-8 w-8" />,
      color: "#10B981",
      features: [
        "Everything in Manager, plus:",
        "Full Security Testing & Scanning to identify vulnerabilities and risks",
        "Automated Site Maintenance Tools for routine checks, cleanup, and optimization",
        "Complete End-to-End SaaS Monitoring of external services and dependencies",
        "UI Testing / Automated Interface Testing for functional validation and workflow stability",
        "Priority-level integrations with broader DevOps tools",
        "Escalation-oriented alert routing across multiple channels",
        "Extended reports for compliance, incident analysis, and QA cycles"
      ],
      idealFor: "Ideal for CTOs, engineering directors, and teams responsible for enterprise-grade uptime.",
      ctaText: "Start Director Plan",
      ctaAction: () => handlePlanSelect("Director", 499),
      isHighlighted: false
    },
    {
      name: "Executive",
      price: "$999/mo",
      priceValue: 999,
      tagline: "The ultimate all-inclusive digital assurance suite — intelligence, automation, insights, and everything you need to run flawless systems at scale.",
      description: "The Executive Plan is built for leaders who cannot afford failures — delivering full-stack observability, AI-powered insights, enterprise automation, SEO monitoring, analytics, and integrated intelligence across your entire platform.",
      icon: <Crown className="h-8 w-8" />,
      color: "#EF4444",
      features: [
        "Everything in Director, plus:",
        "Full SEO Monitoring to ensure ranking health, keyword visibility, and search stability",
        "Comprehensive Analytics & Reporting for performance, UX, SEO, security, and reliability",
        "Deep integration into executive dashboards for business-level decision making",
        "Multi-layer monitoring combining technical, operational, and marketing metrics",
        "Full organizational alert routing with automated prioritization",
        "AI-driven performance modeling for long-term forecasting",
        "Custom reporting tailored to business KPIs and SLAs"
      ],
      idealFor: "Crafted for enterprises, high-traffic platforms, agencies, and mission-critical apps.",
      ctaText: "Start Executive Plan",
      ctaAction: () => handlePlanSelect("Executive", 999),
      isHighlighted: false
    }
  ]

  // Handle plan selection - redirect to checkout
  const handlePlanSelect = (planName: string, price: number) => {
    // Store selected plan in sessionStorage for checkout page
    sessionStorage.setItem('selectedPlan', JSON.stringify({
      name: planName,
      price: price,
      billingPeriod: 'monthly'
    }))
    // Redirect to checkout page
    window.location.href = `/checkout?plan=${encodeURIComponent(planName)}&price=${price}`
  }


  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section - Consistent with other pages */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-slate-900 via-palette-primary to-slate-900">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-10 opacity-35">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-palette-primary rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-palette-accent-1 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse animation-delay-2000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-palette-accent-2 rounded-full mix-blend-multiply filter blur-2xl opacity-55 animate-pulse animation-delay-4000"></div>
          </div>
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="mb-8">
            <Badge variant="outline" className="border-palette-primary/40 text-white/80 bg-palette-primary/15 backdrop-blur-sm px-6 py-2 text-sm font-medium shadow-lg">
              <BarChart3 className="h-4 w-4 mr-2" />
              Progressive Monitoring Capabilities
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Choose Your Plan
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto mb-8 leading-relaxed">
            From <span className="text-white/80 font-semibold">essential monitoring</span> to 
            <span className="text-white/80 font-semibold"> enterprise-grade intelligence</span> — 
            find the perfect plan for your needs.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <div className="px-4 py-2 bg-palette-primary/15 backdrop-blur-sm rounded-full text-white/80 text-sm font-medium border border-palette-primary/40">
              Start Free Forever
            </div>
            <div className="px-4 py-2 bg-palette-primary/15 backdrop-blur-sm rounded-full text-white/80 text-sm font-medium border border-palette-primary/40">
              Plans from $29.99/mo
            </div>
            <div className="px-4 py-2 bg-palette-primary/15 backdrop-blur-sm rounded-full text-white/80 text-sm font-medium border border-palette-primary/40">
              Cancel Anytime
            </div>
            <div className="px-4 py-2 bg-palette-primary/15 backdrop-blur-sm rounded-full text-white/80 text-sm font-medium border border-palette-primary/40">
              No Credit Card Required
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-white to-palette-accent-3">
        <div className="container mx-auto px-4 py-16">

        {/* Pricing Plans - Responsive Grid */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800">Select Your Plan</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Choose the perfect monitoring solution for your needs. All plans include our core features with progressive enhancements.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={plan.name}
                className={`relative transition-all duration-300 hover:shadow-xl h-full flex flex-col ${
                  plan.isHighlighted 
                    ? "border-2 border-palette-primary shadow-2xl shadow-palette-primary/20" 
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {plan.isHighlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-palette-primary text-white px-4 py-1 text-sm font-semibold shadow-lg">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4 flex-shrink-0">
                  <div className="flex justify-center mb-4">
                    <div 
                      className="p-4 rounded-2xl shadow-lg"
                      style={{ backgroundColor: `${plan.color}15`, color: plan.color }}
                    >
                      {plan.icon}
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-bold text-slate-800 mb-2">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold mb-3" style={{ color: plan.color }}>
                    {plan.price}
                  </div>
                  <div className="text-sm font-medium text-slate-700 italic mb-3 px-4">
                    "{plan.tagline}"
                  </div>
                  <CardDescription className="text-slate-600 text-sm leading-relaxed">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6 flex-grow flex flex-col">
                  <div className="flex-grow">
                    <h4 className="font-semibold mb-4 text-slate-800 flex items-center gap-2">
                      <Check className="h-5 w-5" style={{ color: plan.color }} />
                      Includes:
                    </h4>
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-slate-600">
                          <Check className={`h-4 w-4 mt-0.5 flex-shrink-0`} style={{ color: plan.color }} />
                          <span className="leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-slate-200 mt-auto">
                    <p className="text-sm text-slate-600 mb-4 italic">
                      {plan.idealFor}
                    </p>
                    
                    <Button 
                      onClick={plan.ctaAction}
                      className="w-full text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      style={{ 
                        backgroundColor: plan.color,
                        borderColor: plan.color
                      }}
                    >
                      {plan.ctaText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>


        {/* Footer CTA */}
        <div className="text-center bg-gradient-to-r from-palette-accent-3 via-palette-accent-3 to-palette-accent-3 border-2 border-palette-primary/30 rounded-2xl p-10 shadow-xl">
          <div className="mb-6">
            <Badge variant="outline" className="border-palette-primary/30 text-palette-primary bg-palette-accent-3 px-4 py-2 mb-4">
              <Rocket className="h-4 w-4 mr-2" />
              Ready to Get Started?
            </Badge>
          </div>
          
          <h3 className="text-3xl font-bold mb-4 text-slate-800">Ready to Get Started?</h3>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Choose a plan that fits your needs. All plans include our comprehensive monitoring tools with no long-term commitment.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-palette-primary to-palette-secondary hover:from-palette-primary-hover hover:to-palette-secondary-hover text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-4 text-lg"
              onClick={() => window.location.href = "/login"}
            >
              <Rocket className="mr-2 h-5 w-5" />
              Get Started Now
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-palette-primary/30 text-palette-primary hover:bg-palette-accent-3 px-8 py-4 text-lg transition-all duration-300"
              onClick={() => window.location.href = "/"}
            >
              <Zap className="mr-2 h-5 w-5" />
              Try Free Tools First
            </Button>
          </div>
        </div>
        
        </div>
      </div>
    </div>
  )
}