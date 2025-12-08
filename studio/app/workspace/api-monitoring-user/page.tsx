"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Network, CheckCircle, XCircle, Clock, Activity } from "lucide-react";
import { applyTheme } from "@/lib/theme";

export default function APIMonitoringUserPage() {
  return (
    <div className={applyTheme.page()}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <Network className="h-8 w-8 text-palette-primary" />
          API Monitoring
        </h1>
        <p className="text-slate-600 mt-2">Monitor API endpoints and performance for user features</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className={applyTheme.card()}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Healthy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">12</div>
            <p className="text-xs text-slate-600 mt-1">Endpoints</p>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4 text-red-500" />
              Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">0</div>
            <p className="text-xs text-slate-600 mt-1">Active issues</p>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-blue-500" />
              Avg Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-slate-600 mt-1">Response time</p>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-purple-500" />
              Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-slate-600 mt-1">Last 24h</p>
          </CardContent>
        </Card>
      </div>

      <Card className={applyTheme.card()}>
        <CardHeader>
          <CardTitle>API Endpoint Monitoring</CardTitle>
          <CardDescription>Monitor the health and performance of user-facing API endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Network className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">API monitoring dashboard coming soon</p>
            <p className="text-sm text-slate-500 mt-2">This page will display real-time API endpoint status and performance metrics</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

