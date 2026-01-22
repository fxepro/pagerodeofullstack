"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Search, TrendingUp, CheckCircle2, BarChart3 } from "lucide-react";

export default function SEOMonitoringPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-h4-dynamic font-bold">SEO Monitoring</h1>
        <p className="text-muted-foreground mt-1">Monitor search engine rankings, keyword performance, and SEO metrics</p>
      </div>

      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-palette-primary" />
            SEO Overview
          </CardTitle>
          <CardDescription>
            Track your website's search engine optimization performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Search className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <p className="text-muted-foreground">
              SEO monitoring dashboard coming soon. This section will display:
            </p>
            <ul className="mt-4 space-y-2 text-left max-w-md mx-auto">
              <li className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Keyword rankings and position tracking
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Search engine visibility metrics
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Backlink analysis and monitoring
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                On-page SEO audit results
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Competitor analysis and benchmarking
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Stats Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h2-dynamic font-bold">—</div>
            <p className="text-xs text-muted-foreground mt-1">Tracked keywords</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h2-dynamic font-bold">—</div>
            <p className="text-xs text-muted-foreground mt-1">Average ranking</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Organic Traffic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h2-dynamic font-bold">—</div>
            <p className="text-xs text-muted-foreground mt-1">Monthly visitors</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

