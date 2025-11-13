"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Code, CheckCircle, XCircle, BarChart3, Globe, Server, Download, Share2 } from "lucide-react";
import { useApiAnalysis } from "@/hooks/use-api-analysis";
import { ErrorDisplay } from "@/components/error-display";

interface ApiDashboardProps {
  url?: string;
}

export default function ApiDashboard({ url: initialUrl = "" }: ApiDashboardProps) {
  const { 
    loading, 
    results, 
    discovered, 
    statusMessage, 
    runTests,
    error,
    isRetrying,
    clearError
  } = useApiAnalysis({ initialUrl, autoRun: !!initialUrl });

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <Activity className="animate-spin h-12 w-12 text-palette-primary mx-auto mb-4" />
          <p className="text-slate-600">Testing API endpoints for {initialUrl}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorDisplay 
          error={error}
          onRetry={runTests}
          onDismiss={clearError}
          isRetrying={isRetrying}
          variant="alert"
        />
      </div>
    );
  }

  // Show status message even when no results (i.e., no endpoints found)
  if (results.length === 0 && !statusMessage) return null;
  
  // Handle the case where no endpoints were found
  if (results.length === 0 && statusMessage && !loading) {
    return (
      <div className="p-6">
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border border-palette-accent-2/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Code className="h-6 w-6 text-palette-primary" />
                  API Health Check Results
                </h2>
                <p className="text-slate-600 mt-1">No API endpoints discovered</p>
              </div>
              <Button onClick={runTests} disabled={loading} variant="outline" className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3">
                <Activity className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Re-test
              </Button>
            </div>
          </div>

          <Card className="border-palette-accent-2/50 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Code className="h-12 w-12 text-palette-primary mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No API Endpoints Found</h3>
                <p className="text-slate-600 text-sm mb-4">{statusMessage}</p>
                <p className="text-slate-500 text-xs">
                  The website doesn't appear to expose any /api/ endpoints. Add custom endpoints to test specific APIs.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const passedTests = results.filter(r => r.pass).length;
  const totalTests = results.length;
  const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  return (
    <div className="p-6">
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-palette-accent-2/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Code className="h-6 w-6 text-palette-primary" />
                API Health Check Results
              </h2>
              <p className="text-slate-600 mt-1">
                {passedTests}/{totalTests} endpoints passed ({successRate}% success rate)
              </p>
            </div>
            <Button onClick={runTests} disabled={loading} variant="outline" className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3">
              <Activity className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Re-test
            </Button>
          </div>
        </div>

        {statusMessage && (
          <Card className="border-palette-accent-2/50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-palette-primary" />
                <div>
                  <h3 className="font-semibold text-slate-800">Discovery Status</h3>
                  <p className="text-slate-600 text-sm">{statusMessage}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {results.length > 0 && (
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-slate-800">{passedTests}</div>
                <div className="text-sm text-slate-600">Passed Tests</div>
              </CardContent>
            </Card>
            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mx-auto mb-4">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-slate-800">{totalTests - passedTests}</div>
                <div className="text-sm text-slate-600">Failed Tests</div>
              </CardContent>
            </Card>
            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-800">{successRate}%</div>
                <div className="text-sm text-slate-600">Success Rate</div>
              </CardContent>
            </Card>
            <Card className="border-palette-accent-2/50 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-palette-accent-3 rounded-lg mx-auto mb-4">
                  <Globe className="h-6 w-6 text-palette-primary" />
                </div>
                <div className="text-2xl font-bold text-slate-800">{discovered.length}</div>
                <div className="text-sm text-slate-600">Endpoints Found</div>
              </CardContent>
            </Card>
          </div>
        )}

        {results.length > 0 && (
          <Card className="border-palette-accent-2/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Server className="h-5 w-5 text-palette-primary" />
                API Endpoint Test Results
              </CardTitle>
              <CardDescription className="text-slate-600">Detailed results for each discovered API endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${result.pass ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {result.pass ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
                        <code className="text-sm font-mono text-slate-800 bg-white px-2 py-1 rounded border">{result.endpoint}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.status !== null && (
                          <Badge className={`text-xs ${result.status >= 200 && result.status < 300 ? 'bg-green-100 text-green-800' : result.status >= 400 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {result.status}
                          </Badge>
                        )}
                        {result.latency !== null && (
                          <Badge variant="outline" className="text-xs">{result.latency}ms</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


