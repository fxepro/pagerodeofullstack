"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Link2, RefreshCw, ExternalLink, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useLinksAnalysis } from "@/hooks/use-links-analysis";
import { ErrorDisplay } from "@/components/error-display";

interface LinksDashboardProps {
  url?: string;
}

export default function LinksDashboard({ url: initialUrl = "" }: LinksDashboardProps) {
  const {
    loading,
    results,
    statusMessage,
    discoveredLinks,
    runLinkCheck,
    error,
    isRetrying,
    clearError,
  } = useLinksAnalysis({ initialUrl, autoRun: !!initialUrl });

  const getStatusColor = (status: number) => {
    if (status === 0) return "text-red-600 bg-red-50";
    if (status >= 200 && status < 300) return "text-green-600 bg-green-50";
    if (status >= 300 && status < 400) return "text-blue-600 bg-blue-50";
    if (status >= 400) return "text-red-600 bg-red-50";
    return "text-gray-600 bg-gray-50";
  };

  const getStatusIcon = (status: number) => {
    if (status === 0) return <XCircle className="h-4 w-4" />;
    if (status >= 200 && status < 300) return <CheckCircle className="h-4 w-4" />;
    if (status >= 300 && status < 400) return <ExternalLink className="h-4 w-4" />;
    if (status >= 400) return <XCircle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <Activity className="animate-spin h-12 w-12 text-palette-primary mx-auto mb-4" />
          <p className="text-slate-600">Checking links for {initialUrl}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorDisplay 
          error={error}
          onRetry={runLinkCheck}
          onDismiss={clearError}
          isRetrying={isRetrying}
          variant="alert"
        />
      </div>
    );
  }

  if (results.length === 0 && !statusMessage) return null;

  const passed = results.filter(r => r.status >= 200 && r.status < 400).length;
  const broken = results.filter(r => r.status >= 400 || r.status === 0).length;
  const internal = results.filter(r => r.isInternal).length;
  const external = results.filter(r => !r.isInternal).length;

  return (
    <div className="p-6">
      <div className="space-y-6">
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 border border-palette-accent-2/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Link2 className="h-6 w-6 text-palette-primary" />
                  Link Analysis for {initialUrl}
                </h2>
                <p className="text-slate-600 mt-1">
                  Found {discoveredLinks.length} links, checked {results.length} links
                </p>
              </div>
              <Button
                onClick={runLinkCheck}
                disabled={loading}
                variant="outline"
                className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Re-analyze
              </Button>
            </div>
          </div>
        )}

        {statusMessage && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800 font-medium">{statusMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {results.length > 0 && (
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{passed}</div>
                <div className="text-sm text-green-700">Working Links</div>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{broken}</div>
                <div className="text-sm text-red-700">Broken Links</div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{internal}</div>
                <div className="text-sm text-blue-700">Internal Links</div>
              </CardContent>
            </Card>
            <Card className="border-palette-accent-2 bg-palette-accent-3">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-palette-primary">{external}</div>
                <div className="text-sm text-palette-primary">External Links</div>
              </CardContent>
            </Card>
          </div>
        )}

        {results.length > 0 && (
          <Card className="border-palette-accent-2/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Link2 className="h-5 w-5 text-palette-primary" />
                All Links ({results.length})
              </CardTitle>
              <CardDescription className="text-slate-600">
                Complete list of discovered links and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(result.status)}
                        <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-palette-primary hover:text-palette-primary hover:underline truncate">
                          {result.url}
                        </a>
                      </div>
                      {result.linkText && (
                        <p className="text-xs text-slate-500 truncate ml-6">{result.linkText}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge className={`${getStatusColor(result.status)} px-2 py-1`}>
                        {result.status === 0 ? 'Error' : result.status}
                      </Badge>
                      <Badge variant="outline" className="px-2 py-1">
                        {result.isInternal ? 'Internal' : 'External'}
                      </Badge>
                      <span className="text-xs text-slate-500">{result.responseTime}ms</span>
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


