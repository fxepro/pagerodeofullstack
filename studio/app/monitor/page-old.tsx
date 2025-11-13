"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Activity,
  Plus,
  Globe,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Settings,
  Trash2,
  ExternalLink,
  BarChart3,
} from "lucide-react"

// Mock data for monitored websites
const monitoredSites = [
  {
    id: 1,
    url: "https://example.com",
    name: "Example Website",
    status: "healthy",
    lastCheck: "2 minutes ago",
    loadTime: 1.2,
    uptime: 99.9,
    alerts: 0,
    frequency: "5 minutes",
  },
  {
    id: 2,
    url: "https://mystore.com",
    name: "My Store",
    status: "warning",
    lastCheck: "5 minutes ago",
    loadTime: 3.8,
    uptime: 98.5,
    alerts: 2,
    frequency: "10 minutes",
  },
  {
    id: 3,
    url: "https://blog.example.com",
    name: "Company Blog",
    status: "error",
    lastCheck: "1 hour ago",
    loadTime: 8.2,
    uptime: 95.2,
    alerts: 5,
    frequency: "15 minutes",
  },
]

export default function MonitorPage() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSiteUrl, setNewSiteUrl] = useState("")
  const [newSiteName, setNewSiteName] = useState("")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-50 border-green-200"
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "error":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4" />
      case "warning":
        return <AlertTriangle className="h-4 w-4" />
      case "error":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Website Monitoring</h1>
        <p className="text-muted-foreground">Monitor your websites' performance and get alerts when issues arise</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sites</p>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Healthy Sites</p>
                <p className="text-2xl font-bold text-green-600">1</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold text-red-600">7</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Uptime</p>
                <p className="text-2xl font-bold text-foreground">97.9%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sites" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sites">Monitored Sites</TabsTrigger>
          <TabsTrigger value="alerts">Alert Settings</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="sites" className="space-y-6">
          {/* Add New Site */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Monitored Websites</CardTitle>
                  <CardDescription>Manage your website monitoring setup</CardDescription>
                </div>
                <Button onClick={() => setShowAddForm(!showAddForm)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Website
                </Button>
              </div>
            </CardHeader>

            {showAddForm && (
              <CardContent className="border-t">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                  <div>
                    <Label htmlFor="site-url">Website URL</Label>
                    <Input
                      id="site-url"
                      placeholder="https://example.com"
                      value={newSiteUrl}
                      onChange={(e) => setNewSiteUrl(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="site-name">Display Name</Label>
                    <Input
                      id="site-name"
                      placeholder="My Website"
                      value={newSiteName}
                      onChange={(e) => setNewSiteName(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button className="flex-1">Add Site</Button>
                    <Button variant="outline" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Sites List */}
          <div className="space-y-4">
            {monitoredSites.map((site) => (
              <Card key={site.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg border ${getStatusColor(site.status)}`}>
                        {getStatusIcon(site.status)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{site.name}</h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{site.url}</span>
                          <ExternalLink className="h-3 w-3" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">{site.loadTime}s</p>
                        <p className="text-xs text-muted-foreground">Load Time</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">{site.uptime}%</p>
                        <p className="text-xs text-muted-foreground">Uptime</p>
                      </div>
                      <div className="text-center">
                        <Badge variant={site.alerts > 0 ? "destructive" : "secondary"}>{site.alerts} alerts</Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Every {site.frequency}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Settings</CardTitle>
              <CardDescription>Configure when and how you receive alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive alerts via email</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive critical alerts via SMS</p>
                </div>
                <Switch />
              </div>

              <div className="space-y-2">
                <Label>Load Time Threshold</Label>
                <Select defaultValue="3">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 second</SelectItem>
                    <SelectItem value="2">2 seconds</SelectItem>
                    <SelectItem value="3">3 seconds</SelectItem>
                    <SelectItem value="5">5 seconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Downtime Alert After</Label>
                <Select defaultValue="5">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 minute</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Reports</CardTitle>
              <CardDescription>Weekly and monthly performance summaries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Reports Coming Soon</h3>
                <p className="text-muted-foreground">
                  Detailed performance reports and analytics will be available here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
