"use client";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Shield, 
  Settings, 
  MessageSquare, 
  BarChart3, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Globe,
  Brain
} from "lucide-react";

export default function AdminDashboardPage() {

  return (
    <div className="p-6 space-y-6">

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Users</p>
                <p className="text-2xl font-bold text-slate-800">1,234</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Tests</p>
                <p className="text-2xl font-bold text-slate-800">89</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <Activity className="h-3 w-3 mr-1" />
                  +5% from yesterday
                </p>
              </div>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">System Health</p>
                <p className="text-2xl font-bold text-green-600">98.5%</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  All systems operational
                </p>
              </div>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Feedback</p>
                <p className="text-2xl font-bold text-slate-800">23</p>
                <p className="text-xs text-yellow-600 flex items-center mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  3 pending review
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Quick Actions
              </CardTitle>
              <CardDescription className="text-slate-600">
                Manage your PageRodeo platform efficiently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button className="h-20 bg-white hover:bg-slate-50 border-slate-200 text-slate-800 justify-start shadow-sm">
                  <Users className="h-6 w-6 mr-3 text-blue-600" />
                  <div className="text-left">
                    <div className="font-semibold">User Management</div>
                    <div className="text-sm text-slate-600">Manage users and roles</div>
                  </div>
                </Button>
                <Button className="h-20 bg-white hover:bg-slate-50 border-slate-200 text-slate-800 justify-start shadow-sm">
                  <MessageSquare className="h-6 w-6 mr-3 text-yellow-600" />
                  <div className="text-left">
                    <div className="font-semibold">Feedback Review</div>
                    <div className="text-sm text-slate-600">Review user feedback</div>
                  </div>
                </Button>
                <Button className="h-20 bg-white hover:bg-slate-50 border-slate-200 text-slate-800 justify-start shadow-sm">
                  <Settings className="h-6 w-6 mr-3 text-green-600" />
                  <div className="text-left">
                    <div className="font-semibold">System Settings</div>
                    <div className="text-sm text-slate-600">Configure platform</div>
                  </div>
                </Button>
                <Button className="h-20 bg-white hover:bg-slate-50 border-slate-200 text-slate-800 justify-start shadow-sm">
                  <BarChart3 className="h-6 w-6 mr-3 text-palette-primary" />
                  <div className="text-left">
                    <div className="font-semibold">Analytics</div>
                    <div className="text-sm text-slate-600">View usage metrics</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <div>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-green-600" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Database className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-slate-600">Database</span>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Globe className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-slate-600">API Services</span>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Brain className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="text-slate-600">AI Services</span>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Warning</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-slate-600">Performance</span>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">Optimal</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-800 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            Recent Activity
          </CardTitle>
          <CardDescription className="text-slate-600">
            Latest system events and user actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-slate-800">New user registration: john.doe@example.com</p>
                <p className="text-xs text-slate-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-slate-800">Performance test completed for example.com</p>
                <p className="text-xs text-slate-500">5 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-slate-800">New feedback received (Rating: 4/5)</p>
                <p className="text-xs text-slate-500">12 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-slate-800">SSL certificate expired for oldsite.com</p>
                <p className="text-xs text-slate-500">1 hour ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
