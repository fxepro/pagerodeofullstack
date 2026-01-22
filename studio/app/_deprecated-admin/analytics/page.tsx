"use client";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { applyTheme, LAYOUT } from "@/lib/theme";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity, 
  Globe, 
  Clock, 
  Download, 
  Filter,
  Calendar,
  Eye,
  MousePointer,
  Zap,
  AlertTriangle,
  Server,
  Database,
  Wifi,
  Shield,
  Code,
  Brain,
  Link2,
  FileText,
  Lock,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  Search,
  MapPin,
  Smartphone,
  Monitor,
  Tablet
} from "lucide-react";

export default function AdminAnalyticsPage() {
  return (
    <div className={applyTheme.page()}>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Tests</p>
                <p className="text-2xl font-bold text-slate-800">24,567</p>
                <p className="text-xs text-green-400 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5% from last month
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Users</p>
                <p className="text-2xl font-bold text-slate-800">3,247</p>
                <p className="text-xs text-green-400 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8.2% from last month
                </p>
              </div>
              <Users className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-slate-800">1.2s</p>
                <p className="text-xs text-red-400 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                  +0.3s from last month
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Success Rate</p>
                <p className="text-2xl font-bold text-slate-800">98.7%</p>
                <p className="text-xs text-green-400 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +0.2% from last month
                </p>
              </div>
              <Zap className="h-8 w-8 text-palette-accent-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Trends */}
        <Card className={applyTheme.card()}>
          <CardHeader>
            <CardTitle className={`${applyTheme.text('primary')} flex items-center`}>
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
              Usage Trends
            </CardTitle>
            <CardDescription className={applyTheme.text('secondary')}>
              Daily test executions over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 space-y-2">
              {/* Mock bar chart */}
              <div className="flex items-end space-x-1 h-48">
                {[45, 52, 38, 61, 49, 73, 82, 67, 71, 58, 84, 76, 69, 91, 85, 72, 88, 94, 79, 86, 92, 87, 81, 95, 89, 83, 77, 90, 96, 88].map((value, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm flex-1 min-w-[8px] transition-all duration-300 hover:from-blue-500 hover:to-blue-300"
                    style={{ height: `${(value / 100) * 100}%` }}
                    title={`Day ${index + 1}: ${value} tests`}
                  ></div>
                ))}
              </div>
              <div className={`flex justify-between text-xs ${applyTheme.text('muted')}`}>
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Distribution */}
        <Card className={applyTheme.card()}>
          <CardHeader>
            <CardTitle className={`${applyTheme.text('primary')} flex items-center`}>
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Performance Distribution
            </CardTitle>
            <CardDescription className={applyTheme.text('secondary')}>
              Website performance scores distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className={`text-sm ${applyTheme.text('primary')}`}>90-100 (Excellent)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-slate-200 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full transition-all duration-500" style={{ width: '45%' }}></div>
                  </div>
                  <span className={`text-sm ${applyTheme.text('secondary')} w-12 text-right`}>45%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className={`text-sm ${applyTheme.text('primary')}`}>70-89 (Good)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-slate-200 rounded-full h-3">
                    <div className="bg-yellow-500 h-3 rounded-full transition-all duration-500" style={{ width: '35%' }}></div>
                  </div>
                  <span className={`text-sm ${applyTheme.text('secondary')} w-12 text-right`}>35%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className={`text-sm ${applyTheme.text('primary')}`}>50-69 (Needs Work)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-slate-200 rounded-full h-3">
                    <div className="bg-orange-500 h-3 rounded-full transition-all duration-500" style={{ width: '15%' }}></div>
                  </div>
                  <span className={`text-sm ${applyTheme.text('secondary')} w-12 text-right`}>15%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className={`text-sm ${applyTheme.text('primary')}`}>0-49 (Poor)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-slate-200 rounded-full h-3">
                    <div className="bg-red-500 h-3 rounded-full transition-all duration-500" style={{ width: '5%' }}></div>
                  </div>
                  <span className={`text-sm ${applyTheme.text('secondary')} w-12 text-right`}>5%</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="text-center">
                <p className={`text-2xl font-bold ${applyTheme.text('primary')}`}>87.3</p>
                <p className={`text-sm ${applyTheme.text('secondary')}`}>Average Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Usage */}
      <Card className={applyTheme.card()}>
        <CardHeader>
          <CardTitle className={`${applyTheme.text('primary')} flex items-center`}>
            <Globe className="h-5 w-5 mr-2 text-palette-primary" />
            Feature Usage Statistics
          </CardTitle>
          <CardDescription className={applyTheme.text('secondary')}>
            Most popular features and tools used by your users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <span className={`font-medium ${applyTheme.text('primary')}`}>Performance Tests</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">8,234</Badge>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <p className={`text-xs ${applyTheme.text('secondary')} mt-1`}>85% of total usage</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  <span className={`font-medium ${applyTheme.text('primary')}`}>Monitoring</span>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">5,678</Badge>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <p className={`text-xs ${applyTheme.text('secondary')} mt-1`}>65% of total usage</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-yellow-600" />
                  <span className={`font-medium ${applyTheme.text('primary')}`}>SSL Checks</span>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">3,456</Badge>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <p className={`text-xs ${applyTheme.text('secondary')} mt-1`}>45% of total usage</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <MousePointer className="h-5 w-5 text-palette-primary" />
                  <span className={`font-medium ${applyTheme.text('primary')}`}>API Tests</span>
                </div>
                <Badge className="bg-palette-accent-3 text-palette-primary border-palette-accent-2">2,345</Badge>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-palette-accent-1 h-2 rounded-full" style={{ width: '35%' }}></div>
              </div>
              <p className={`text-xs ${applyTheme.text('secondary')} mt-1`}>35% of total usage</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  <span className={`font-medium ${applyTheme.text('primary')}`}>Sitemaps</span>
                </div>
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">1,789</Badge>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
              <p className={`text-xs ${applyTheme.text('secondary')} mt-1`}>25% of total usage</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-red-600" />
                  <span className={`font-medium ${applyTheme.text('primary')}`}>AI Health</span>
                </div>
                <Badge className="bg-red-100 text-red-800 border-red-200">987</Badge>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '15%' }}></div>
              </div>
              <p className={`text-xs ${applyTheme.text('secondary')} mt-1`}>15% of total usage</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Sites */}
        <Card className={applyTheme.card()}>
          <CardHeader>
            <CardTitle className={`${applyTheme.text('primary')} flex items-center`}>
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Top Performing Sites
            </CardTitle>
            <CardDescription className={applyTheme.text('secondary')}>
              Websites with the best performance scores this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <p className={`font-medium ${applyTheme.text('primary')}`}>example.com</p>
                  <p className={`text-sm ${applyTheme.text('secondary')}`}>Performance Score</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-100 text-green-800 border-green-200 mb-1">98</Badge>
                  <p className={`text-xs ${applyTheme.text('secondary')}`}>324 tests</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <p className={`font-medium ${applyTheme.text('primary')}`}>demo-site.org</p>
                  <p className={`text-sm ${applyTheme.text('secondary')}`}>Performance Score</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-100 text-green-800 border-green-200 mb-1">96</Badge>
                  <p className={`text-xs ${applyTheme.text('secondary')}`}>256 tests</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <p className={`font-medium ${applyTheme.text('primary')}`}>test-website.net</p>
                  <p className={`text-sm ${applyTheme.text('secondary')}`}>Performance Score</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-100 text-green-800 border-green-200 mb-1">94</Badge>
                  <p className={`text-xs ${applyTheme.text('secondary')}`}>189 tests</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card className={applyTheme.card()}>
          <CardHeader>
            <CardTitle className={`${applyTheme.text('primary')} flex items-center`}>
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
              System Alerts
            </CardTitle>
            <CardDescription className={applyTheme.text('secondary')}>
              Recent system notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${applyTheme.text('primary')}`}>High response time detected</p>
                  <p className={`text-xs ${applyTheme.text('secondary')}`}>API endpoint /analyze showing 3.2s avg response</p>
                  <p className={`text-xs ${applyTheme.text('muted')} mt-1`}>2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${applyTheme.text('primary')}`}>Database backup completed</p>
                  <p className={`text-xs ${applyTheme.text('secondary')}`}>Weekly backup finished successfully</p>
                  <p className={`text-xs ${applyTheme.text('muted')} mt-1`}>1 hour ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${applyTheme.text('primary')}`}>New user milestone reached</p>
                  <p className={`text-xs ${applyTheme.text('secondary')}`}>Platform now has 3,000+ active users</p>
                  <p className={`text-xs ${applyTheme.text('muted')} mt-1`}>3 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
