"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Network, RefreshCw, Download, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { useSitemapAnalysis } from "@/hooks/use-sitemap-analysis";
import { ErrorDisplay } from "@/components/error-display";

export default function SitemapDashboard({ url: initialUrl = "" }: { url?: string }) {
  const { 
    loading, 
    sitemap, 
    countTotalPages, 
    toggleNode, 
    expandedNodes, 
    exportSitemap, 
    runAnalysis,
    error,
    isRetrying,
    clearError
  } = useSitemapAnalysis({ initialUrl, autoRun: !!initialUrl });

  const renderTableRow = (node: any, depth: number = 0): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.url);
    return (
      <React.Fragment key={node.url}>
        <tr className={`border-b border-gray-100 hover:bg-gray-50 ${depth === 0 ? 'bg-palette-accent-3' : depth === 1 ? 'bg-blue-50' : depth === 2 ? 'bg-green-50' : depth >= 3 ? 'bg-yellow-50' : ''}`}>
          <td className="p-4">
            <div className="flex items-center" style={{ paddingLeft: `${depth * 24}px` }}>
              {hasChildren && (
                <button onClick={() => toggleNode(node.url)} className="mr-2 p-1 hover:bg-gray-200 rounded">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              )}
              {!hasChildren && <div className="w-6" />}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${node.status === 'success' ? 'bg-green-500' : node.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                <span className="font-medium text-sm">{node.title}</span>
              </div>
            </div>
          </td>
          <td className="p-4"><Badge variant="outline" className="text-xs">{depth}</Badge></td>
          <td className="p-4 text-right">
            <a href={node.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
              <ExternalLink className="h-4 w-4" />
            </a>
          </td>
        </tr>
        {isExpanded && hasChildren && node.children.map((child: any) => renderTableRow(child, depth + 1))}
      </React.Fragment>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <RefreshCw className="animate-spin h-12 w-12 text-palette-primary mx-auto mb-4" />
          <p className="text-slate-600">Generating sitemap for {initialUrl}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorDisplay 
          error={error}
          onRetry={runAnalysis}
          onDismiss={clearError}
          isRetrying={isRetrying}
          variant="alert"
        />
      </div>
    );
  }

  if (sitemap.length === 0) return null;

  const totalPages = sitemap.reduce((count, node) => {
    const countNode = (n: any): number => 1 + (n.children || []).reduce((sum: number, c: any) => sum + countNode(c), 0);
    return count + countNode(node);
  }, 0);

  return (
    <div className="p-6">
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-palette-accent-2/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Network className="h-6 w-6 text-palette-primary" />
                Sitemap Structure
              </h2>
              <p className="text-slate-600 mt-1">Found {totalPages} pages in sitemap hierarchy</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={runAnalysis} variant="outline" className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3">
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-analyze
              </Button>
              <Button onClick={exportSitemap} variant="outline" className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        <Card className="border-palette-accent-2/50 shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-purple-100">
                    <th className="text-left p-4 font-semibold text-slate-700">Page</th>
                    <th className="text-left p-4 font-semibold text-slate-700">Depth</th>
                    <th className="text-right p-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sitemap.map((node: any) => renderTableRow(node))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


