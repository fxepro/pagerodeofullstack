"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Eye, MousePointerClick } from "lucide-react";
import { applyTheme } from "@/lib/theme";

export default function GoogleAnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-h4-dynamic font-bold">Google Analytics</h1>
        <p className="text-muted-foreground mt-1">View and analyze your Google Analytics data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className={applyTheme.card()}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-blue-500" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h2-dynamic font-bold">--</div>
            <p className="text-xs text-slate-600 mt-1">Total users</p>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4 text-green-500" />
              Page Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h2-dynamic font-bold">--</div>
            <p className="text-xs text-slate-600 mt-1">Total views</p>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MousePointerClick className="h-4 w-4 text-purple-500" />
              Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h2-dynamic font-bold">--</div>
            <p className="text-xs text-slate-600 mt-1">Total clicks</p>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              Bounce Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h2-dynamic font-bold">--</div>
            <p className="text-xs text-slate-600 mt-1">Average rate</p>
          </CardContent>
        </Card>
      </div>

      <Card className={applyTheme.card()}>
        <CardHeader>
          <CardTitle>Google Analytics Dashboard</CardTitle>
          <CardDescription>Connect your Google Analytics account to view detailed analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">Google Analytics integration coming soon</p>
            <p className="text-sm text-slate-500 mt-2">This page will display your Google Analytics data and insights</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

