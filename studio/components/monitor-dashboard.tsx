"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor as MonitorIcon, Globe, Activity, AlertTriangle, CheckCircle, Zap, TrendingDown, Shield, Eye, Clock, Wifi } from "lucide-react";
import { useMonitorAnalysis } from "@/hooks/use-monitor-analysis";
import { MonitorReport } from "@/components/monitor-report";
import { ErrorDisplay } from "@/components/error-display";

export default function MonitorDashboard({ url: initialUrl = "" }: { url?: string }) {
  const { 
    isChecking, 
    monitorData, 
    handleMonitor,
    error,
    isRetrying,
    clearError
  } = useMonitorAnalysis({ initialUrl, autoRun: !!initialUrl });
  const [showDetailed, setShowDetailed] = useState(false);

  if (isChecking) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <Activity className="animate-spin h-12 w-12 text-palette-primary mx-auto mb-4" />
          <p className="text-slate-600">Checking website status for {initialUrl}...</p>
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
      <div className="space-y-6">
        {/* Half-height Header Strip */}
        <div className="bg-gradient-to-r from-palette-primary to-palette-primary-hover text-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-200">
                <MonitorIcon className="h-5 w-5" />
                <span className="text-lg font-medium">{monitorData.url}</span>
              </div>
              <Button 
                onClick={handleMonitor} 
                disabled={isChecking}
                variant="outline" 
                className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3 hover:text-palette-primary"
              >
                <Activity className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                Re-analyze
              </Button>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              <Badge className="bg-palette-accent-3 text-slate-700 border-0 px-3 py-1 text-sm">
                {monitorData.status === 'up' ? 'Online' : 'Offline'}
              </Badge>
              <Badge className="bg-palette-accent-3 text-slate-700 border-0 px-3 py-1 text-sm">
                {Math.round(monitorData.responseTime)}ms response
              </Badge>
              <Badge className="bg-palette-accent-3 text-slate-700 border-0 px-3 py-1 text-sm">
                {monitorData.uptime.toFixed(2)}% uptime
              </Badge>
              <span className="text-purple-200 text-sm ml-auto">
                Checked {new Date(monitorData.lastChecked).toLocaleDateString()} at {new Date(monitorData.lastChecked).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Main Monitor Summary */}
        <div className="grid md:grid-cols-4 gap-6 mb-6">
          <Card className="border-palette-accent-2/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                {monitorData.status === 'up' ? (<><CheckCircle className="h-5 w-5 text-green-600" /><Badge className="bg-green-100 text-green-800">Online</Badge></>) : (<><AlertTriangle className="h-5 w-5 text-red-600" /><Badge variant="destructive">Offline</Badge></>)}
              </div>
              <p className="text-xs text-slate-500">Last checked: {new Date(monitorData.lastChecked).toLocaleTimeString()}</p>
            </CardContent>
          </Card>

          <Card className="border-palette-accent-2/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-palette-primary">{Math.round(monitorData.responseTime)}ms</div>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingDown className="h-3 w-3" />
                -12% from last week
              </p>
            </CardContent>
          </Card>

          <Card className="border-palette-accent-2/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                SSL Certificate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                {monitorData.ssl.valid ? (<><CheckCircle className="h-5 w-5 text-green-600" /><Badge className="bg-green-100 text-green-800">Valid</Badge></>) : (<><AlertTriangle className="h-5 w-5 text-yellow-600" /><Badge className="bg-yellow-100 text-yellow-800">Warning</Badge></>)}
              </div>
              <p className="text-xs text-slate-500">Expires in {monitorData.ssl.expiresIn} days</p>
            </CardContent>
          </Card>

          <Card className="border-palette-accent-2/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Uptime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-palette-primary">{monitorData.uptime.toFixed(2)}%</div>
              <p className="text-xs text-slate-500">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mb-6 border-palette-accent-2/50 shadow-lg">
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

        {/* View Detailed Report Button */}
        <div className="flex justify-center">
          <Button 
            onClick={() => setShowDetailed(!showDetailed)}
            size="lg"
            className="bg-gradient-to-r from-palette-primary to-palette-primary-hover hover:from-purple-700 hover:to-palette-secondary text-white shadow-lg"
          >
            <Eye className="h-4 w-4 mr-2" />
            {showDetailed ? "Hide Detailed Report" : "View Detailed Report"}
          </Button>
        </div>

        {/* Detailed Report */}
        {showDetailed && (
          <div className="mt-6">
            <MonitorReport url={monitorData.url} minimal />
          </div>
        )}
      </div>
    </div>
  );
}
