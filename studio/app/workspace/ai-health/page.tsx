"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, CheckCircle, Cpu } from "lucide-react";
import { applyTheme } from "@/lib/theme";

export default function AIHealthPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-h4-dynamic font-bold">AI Health Monitoring</h1>
        <p className="text-muted-foreground mt-1">Monitor AI system health and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className={applyTheme.card()}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <span className="text-h4-dynamic font-semibold">Operational</span>
            </div>
            <p className="text-sm text-slate-600 mt-2">All systems running normally</p>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardHeader>
            <CardTitle>Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h1-dynamic font-bold text-palette-primary">245ms</div>
            <p className="text-sm text-slate-600 mt-2">Average response time</p>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardHeader>
            <CardTitle>Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h1-dynamic font-bold text-green-600">99.9%</div>
            <p className="text-sm text-slate-600 mt-2">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Card className={applyTheme.card()}>
        <CardHeader>
          <CardTitle>AI Health Metrics</CardTitle>
          <CardDescription>Real-time monitoring of AI system performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Cpu className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">AI Health monitoring dashboard coming soon</p>
            <p className="text-sm text-slate-500 mt-2">This page will display detailed AI system health metrics and analytics</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

