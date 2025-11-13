"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Globe, Zap, Clock, Shield, BarChart3, CheckCircle, TrendingUp, Server, Eye, Target } from "lucide-react"

const testingTools = [
  {
    name: "WebPageTest",
    description: "Industry-standard performance testing",
    icon: Target,
    status: "active",
    lastRun: "2 minutes ago",
    score: 92,
  },
  {
    name: "Sitespeed.io",
    description: "Open source web performance tool",
    icon: TrendingUp,
    status: "active",
    lastRun: "5 minutes ago",
    score: 88,
  },
  {
    name: "Yellow Lab Tools",
    description: "Advanced performance auditing",
    icon: Eye,
    status: "active",
    lastRun: "3 minutes ago",
    score: 85,
  },
  {
    name: "Lighthouse",
    description: "Google's performance insights",
    icon: Zap,
    status: "active",
    lastRun: "1 minute ago",
    score: 94,
  },
]

const serverLocations = [
  { name: "Sydney, Australia", region: "APAC", ping: "12ms", status: "online" },
  { name: "Mumbai, India", region: "APAC", ping: "8ms", status: "online" },
  { name: "London, UK", region: "EU", ping: "15ms", status: "online" },
  { name: "Frankfurt, Germany", region: "EU", ping: "11ms", status: "online" },
  { name: "New York, USA", region: "Americas", ping: "22ms", status: "online" },
  { name: "São Paulo, Brazil", region: "Americas", ping: "18ms", status: "online" },
  { name: "Tokyo, Japan", region: "APAC", ping: "9ms", status: "online" },
  { name: "Singapore", region: "APAC", ping: "14ms", status: "online" },
]

const monitoredSites = [
  {
    url: "example.com",
    status: "healthy",
    avgLoadTime: "1.2s",
    uptime: "99.9%",
    lastCheck: "30s ago",
    tools: ["WebPageTest", "Lighthouse", "Sitespeed.io"],
  },
  {
    url: "shop.example.com",
    status: "warning",
    avgLoadTime: "3.1s",
    uptime: "98.7%",
    lastCheck: "1m ago",
    tools: ["Yellow Lab Tools", "Lighthouse"],
  },
  {
    url: "blog.example.com",
    status: "healthy",
    avgLoadTime: "0.9s",
    uptime: "100%",
    lastCheck: "45s ago",
    tools: ["WebPageTest", "Sitespeed.io"],
  },
]

export default function UpgradePage() {
  const [selectedLocation, setSelectedLocation] = useState("sydney")
  const [autoScaling, setAutoScaling] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Premium Performance Monitoring</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Monitor your websites with multiple testing tools from servers worldwide. Get comprehensive insights and
            alerts to keep your sites performing at their best.
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="tools">Testing Tools</TabsTrigger>
            <TabsTrigger value="locations">Global Servers</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sites Monitored</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">+2 from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Load Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">1.4s</div>
                  <p className="text-xs text-muted-foreground">-0.2s improvement</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">99.8%</div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tests Run</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2,847</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
            </div>

            {/* Monitored Sites */}
            <Card>
              <CardHeader>
                <CardTitle>Monitored Websites</CardTitle>
                <CardDescription>Real-time performance monitoring across multiple tools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monitoredSites.map((site, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            site.status === "healthy"
                              ? "bg-green-500"
                              : site.status === "warning"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                        />
                        <div>
                          <div className="font-medium">{site.url}</div>
                          <div className="text-sm text-muted-foreground">
                            {site.tools.join(", ")} • Last check: {site.lastCheck}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{site.avgLoadTime}</div>
                        <div className="text-sm text-muted-foreground">{site.uptime} uptime</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Testing Tools</CardTitle>
                <CardDescription>Multiple industry-standard tools for comprehensive analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {testingTools.map((tool, index) => {
                    const IconComponent = tool.icon
                    return (
                      <Card key={index}>
                        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                          <IconComponent className="h-8 w-8 text-primary mr-3" />
                          <div className="flex-1">
                            <CardTitle className="text-lg">{tool.name}</CardTitle>
                            <CardDescription>{tool.description}</CardDescription>
                          </div>
                          <Badge variant={tool.status === "active" ? "default" : "secondary"}>{tool.status}</Badge>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Performance Score</span>
                            <span className="font-bold text-green-600">{tool.score}/100</span>
                          </div>
                          <Progress value={tool.score} className="mb-2" />
                          <div className="text-xs text-muted-foreground">Last run: {tool.lastRun}</div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Global Testing Servers</CardTitle>
                <CardDescription>
                  Test from multiple locations worldwide for accurate performance insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium">Auto-scaling</h3>
                      <p className="text-sm text-muted-foreground">
                        Automatically distribute tests across optimal servers
                      </p>
                    </div>
                    <Switch checked={autoScaling} onCheckedChange={setAutoScaling} />
                  </div>

                  <div className="mb-4">
                    <label className="text-sm font-medium mb-2 block">Primary Testing Location</label>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {serverLocations.map((location, index) => (
                          <SelectItem key={index} value={location.name.toLowerCase().replace(/[^a-z]/g, "")}>
                            {location.name} ({location.ping})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {serverLocations.map((location, index) => (
                    <Card key={index} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Server className="h-4 w-4 text-primary" />
                            <span className="font-medium">{location.name}</span>
                          </div>
                          <div
                            className={`w-2 h-2 rounded-full ${
                              location.status === "online" ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                        </div>
                        <div className="text-sm text-muted-foreground mb-1">{location.region}</div>
                        <div className="text-sm font-medium text-green-600">{location.ping}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Starter</CardTitle>
                  <CardDescription>Perfect for small websites</CardDescription>
                  <div className="text-3xl font-bold">
                    $29<span className="text-lg font-normal">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">5 websites monitored</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">2 testing tools</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">3 global locations</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Daily monitoring</span>
                    </div>
                  </div>
                  <Button className="w-full">Get Started</Button>
                </CardContent>
              </Card>

              <Card className="border-primary">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Professional</CardTitle>
                      <CardDescription>Most popular choice</CardDescription>
                    </div>
                    <Badge>Popular</Badge>
                  </div>
                  <div className="text-3xl font-bold">
                    $79<span className="text-lg font-normal">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">25 websites monitored</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">All 4 testing tools</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">All 8 global locations</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Hourly monitoring</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Email & Slack alerts</span>
                    </div>
                  </div>
                  <Button className="w-full">Upgrade Now</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <CardDescription>For large organizations</CardDescription>
                  <div className="text-3xl font-bold">
                    $199<span className="text-lg font-normal">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Unlimited websites</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">All testing tools + API</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Custom server locations</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Real-time monitoring</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Priority support</span>
                    </div>
                  </div>
                  <Button className="w-full">Contact Sales</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
