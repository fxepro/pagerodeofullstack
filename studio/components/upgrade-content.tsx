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
  Download, 
  Save, 
  Mail, 
  Clock,
  ArrowRight,
  Monitor,
  Shield,
  BarChart3,
  Globe,
  AlertTriangle,
  Database,
  Settings,
  Bell,
  Eye,
  Rocket
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RoleData {
  name: string
  icon: React.ReactNode
  color: string
  focus: string
  target: string
  description: string
  features: string[]
}

interface TierData {
  name: string
  description: string
  icon: React.ReactNode
  color: string
  features: string[]
  limitations?: string[]
  ctaText: string
  ctaAction: () => void
  isLoginRequired: boolean
  isHighlighted?: boolean
}

export function UpgradeContent() {
  const [email, setEmail] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [isSubscribing, setIsSubscribing] = useState(false)
  const { toast } = useToast()

  // Current Active Tiers
  const currentTiers: TierData[] = [
    {
      name: "Free",
      description: "Test any website instantly with no signup required",
      icon: <Zap className="h-8 w-8 text-blue-600" />,
      color: "blue",
      features: [
        "Website performance testing",
        "Core Web Vitals analysis",
        "SSL certificate checks",
        "Basic monitoring",
        "Real-time results",
        "Share analysis summary"
      ],
      limitations: [
        "No data persistence",
        "No download options",
        "No saved reports",
        "No personal history"
      ],
      ctaText: "Try Now",
      ctaAction: () => window.location.href = "/",
      isLoginRequired: false,
      isHighlighted: false
    },
    {
      name: "Viewer",
      description: "Enhanced features with login - save, download & track progress",
      icon: <Eye className="h-8 w-8 text-palette-primary" />,
      color: "purple",
      features: [
        "Everything in Free tier",
        "Download PDF reports",
        "Save analysis history",
        "Personal dashboard",
        "Export data (JSON/CSV)",
        "Bookmark favorite sites",
        "Enhanced insights"
      ],
      ctaText: "Login / Register",
      ctaAction: () => window.location.href = "/login",
      isLoginRequired: true,
      isHighlighted: true
    }
  ]

  // Role-based Roadmap
  const roles: RoleData[] = [
    {
      name: "Analyst",
      icon: <Search className="h-8 w-8" />,
      color: "#3B82F6",
      focus: "Tactical monitoring & issue resolution",
      target: "Individual contributors, DevOps engineers",
      description: "Core monitoring capabilities for hands-on problem solving",
      features: [
        "API endpoint monitoring",
        "HTTP/Ping checks",
        "DNS monitoring", 
        "SSL certificate checks",
        "Latency tracking",
        "Error rate monitoring",
        "Service performance metrics"
      ]
    },
    {
      name: "Manager",
      icon: <Users className="h-8 w-8" />,
      color: "#8B5CF6",
      focus: "Operational oversight & customer experience",
      target: "Team leads, operations managers",
      description: "Enhanced monitoring with team collaboration and UX insights",
      features: [
        "Everything in Analyst",
        "User experience monitoring",
        "End-user journey checks",
        "Synthetic transactions",
        "Mobile/web performance testing",
        "Usage trends analytics",
        "SLA/SLO analytics",
        "Team productivity insights"
      ]
    },
    {
      name: "Director",
      icon: <Crown className="h-8 w-8" />,
      color: "#F59E0B",
      focus: "Strategic governance & organizational alignment",
      target: "C-level executives, IT directors",
      description: "Enterprise-grade monitoring with governance and compliance",
      features: [
        "Everything in Analyst + Manager",
        "Infrastructure & logs monitoring",
        "Log aggregation",
        "Infra health dashboards",
        "Cloud & container observability",
        "Incident lifecycle management",
        "On-call schedules",
        "Escalation chains",
        "RCA reporting",
        "Role-based access control (RBAC)",
        "Compliance settings",
        "Audit trails",
        "Data retention policies"
      ]
    }
  ]

  const handleRoleSignup = async (roleName: string) => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to get updates.",
        variant: "destructive",
      })
      return
    }

    setIsSubscribing(true)
    setSelectedRole(roleName)
    
    try {
      // Send to Django backend
      const response = await fetch('http://localhost:8000/api/update-signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          role: roleName
        }),
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        toast({
          title: "Successfully Subscribed!",
          description: `You'll be notified when ${roleName} features are released.`,
        })
        
        setEmail("")
        setSelectedRole("")
      } else {
        throw new Error(result.error || 'Failed to subscribe for updates')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to subscribe for updates. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section - Consistent with other pages */}
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
          <div className="mb-8">
            <Badge variant="outline" className="border-white/40 text-white bg-white/15 backdrop-blur-sm px-6 py-2 text-sm font-medium shadow-lg">
              <BarChart3 className="h-4 w-4 mr-2" />
              Progressive Monitoring Capabilities
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Choose Your Monitoring Level
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto mb-8 leading-relaxed">
            Start with our <span className="text-white font-semibold">free tools today</span>, or explore our 
            <span className="text-purple-100 font-semibold"> roadmap for advanced monitoring</span> capabilities 
            designed for <span className="text-purple-50 font-semibold">different organizational roles</span>.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              Free Tools
            </div>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              Role-Based Features
            </div>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              Enterprise Ready
            </div>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
              Progressive Upgrade
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
        <div className="container mx-auto px-4 py-16">

        {/* Current Active Tiers - 2 Column Grid */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-slate-800">Available Now</h2>
            <p className="text-lg text-slate-600">Start monitoring your websites today with these active features</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            {currentTiers.map((tier) => (
              <Card 
                key={tier.name}
                className={`relative transition-all duration-300 hover:shadow-lg ${
                  tier.isHighlighted 
                    ? "border-2 border-palette-accent-1 scale-105 shadow-xl shadow-purple-500/20" 
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    {tier.icon}
                  </div>
                  <div className="flex justify-center items-center gap-3 mb-2">
                    <CardTitle className="text-2xl text-slate-800">{tier.name}</CardTitle>
                    {tier.isHighlighted && (
                      <Badge className="bg-palette-primary text-white">Recommended</Badge>
                    )}
                  </div>
                  <CardDescription className="text-slate-600">
                    {tier.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-slate-800">Features</h4>
                    <ul className="space-y-2">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                          <Check className={`h-4 w-4 ${tier.color === 'purple' ? 'text-palette-primary' : 'text-blue-600'}`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {tier.limitations && (
                    <div>
                      <h4 className="font-semibold mb-3 text-slate-800">Limitations</h4>
                      <ul className="space-y-2">
                        {tier.limitations.map((limitation) => (
                          <li key={limitation} className="flex items-center gap-2 text-sm text-slate-500">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button 
                    onClick={tier.ctaAction}
                    className={`w-full ${
                      tier.isHighlighted
                        ? "bg-gradient-to-r from-palette-accent-1 to-palette-primary hover:from-palette-primary hover:to-palette-primary-hover text-white shadow-lg"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {tier.ctaText}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Roadmap Tiers - 3 Role Rows */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-slate-800">Coming Soon</h2>
            <p className="text-lg text-slate-600">Advanced monitoring capabilities designed for different organizational roles</p>
          </div>
          
          <div className="space-y-12 max-w-7xl mx-auto">
            {roles.map((role, index) => (
              <Card key={role.name} className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                {/* Gradient background overlay */}
                <div 
                  className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500"
                  style={{ background: `linear-gradient(135deg, ${role.color}20, ${role.color}40)` }}
                ></div>
                
                {/* Role badge */}
                <div className="absolute top-6 right-6">
                  <Badge 
                    className="px-3 py-1 text-xs font-semibold shadow-lg"
                    style={{ backgroundColor: role.color, color: 'white' }}
                  >
                    {index === 0 ? 'Stage 1' : index === 1 ? 'Stage 2' : 'Stage 3'}
                  </Badge>
                </div>

                <CardContent className="relative p-10">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
                    
                    {/* Role Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-6 mb-6">
                        <div 
                          className="p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300"
                          style={{ backgroundColor: role.color, color: 'white' }}
                        >
                          {role.icon}
                        </div>
                        <div>
                          <h3 className="text-3xl font-bold text-slate-800 mb-2">{role.name}</h3>
                          <p className="text-base text-slate-600 font-medium">{role.target}</p>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <p className="text-lg text-slate-700 mb-3 font-medium">{role.description}</p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                             style={{ backgroundColor: `${role.color}15`, color: role.color }}>
                          <Shield className="h-4 w-4" />
                          <span>{role.focus}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                        {role.features.slice(0, 8).map((feature, featureIndex) => (
                          <div key={feature} className="flex items-center gap-3 text-sm text-slate-600 bg-white/50 rounded-lg p-3 hover:bg-white/80 transition-colors duration-200">
                            <div 
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: role.color }}
                            ></div>
                            <span className="font-medium">{feature}</span>
                          </div>
                        ))}
                        {role.features.length > 8 && (
                          <div className="flex items-center gap-3 text-sm text-slate-500 bg-slate-100 rounded-lg p-3">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: role.color }}
                            ></div>
                            <span className="font-medium">+{role.features.length - 8} more features</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Signup Section */}
                    <div className="lg:w-96">
                      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 border border-slate-200/50 shadow-lg">
                        <div className="space-y-6">
                          <div className="text-center">
                            <h4 className="text-lg font-bold text-slate-800 mb-2">Get Early Access</h4>
                            <p className="text-sm text-slate-600">Be the first to know when {role.name} features launch</p>
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor={`email-${role.name}`} className="text-sm font-medium text-slate-700">
                              Email Address
                            </Label>
                            <Input
                              id={`email-${role.name}`}
                              type="email"
                              placeholder="Enter your email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full border-slate-300 focus:border-palette-accent-1"
                            />
                          </div>
                          
                          <Button 
                            onClick={() => handleRoleSignup(role.name)}
                            disabled={isSubscribing}
                            className="w-full text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            style={{ 
                              backgroundColor: role.color,
                              borderColor: role.color
                            }}
                          >
                            {isSubscribing && selectedRole === role.name ? (
                              <>
                                <Clock className="h-4 w-4 mr-2 animate-spin" />
                                Subscribing...
                              </>
                            ) : (
                              <>
                                <Mail className="h-4 w-4 mr-2" />
                                Sign Up for Updates
                              </>
                            )}
                          </Button>
                          
                          <div className="flex items-start gap-2 text-xs text-slate-500">
                            <Check className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                            <span>We'll only notify you about {role.name} feature releases. No spam, ever.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center bg-gradient-to-r from-palette-accent-1/10 via-purple-400/5 to-palette-primary/10 border-2 border-palette-accent-1/20 rounded-2xl p-10 shadow-xl">
          <div className="mb-6">
            <Badge variant="outline" className="border-palette-accent-2 text-palette-primary bg-palette-accent-3 px-4 py-2 mb-4">
              <Rocket className="h-4 w-4 mr-2" />
              Ready to Get Started?
            </Badge>
          </div>
          
          <h3 className="text-3xl font-bold mb-4 text-slate-800">Start Monitoring Today</h3>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Begin with our free tools and be the first to know when advanced role-based features launch.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-palette-accent-1 to-palette-primary hover:from-palette-primary hover:to-palette-primary-hover text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-4 text-lg"
              onClick={() => window.location.href = "/"}
            >
              <Zap className="mr-2 h-5 w-5" />
              Start Free Analysis
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3 px-8 py-4 text-lg transition-all duration-300 transform hover:scale-105"
              onClick={() => window.location.href = "/login"}
            >
              <Eye className="mr-2 h-5 w-5" />
              Login for Enhanced Features
            </Button>
          </div>
        </div>
        
        </div>
      </div>
    </div>
  )
}