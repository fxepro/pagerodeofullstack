"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Network, Globe, Download, RefreshCw, ExternalLink, ChevronRight, ChevronDown, Zap, Eye, BarChart3, ArrowRight, Wifi, Server, Shield, CheckCircle } from "lucide-react";
import { ConsultationCTA } from "@/components/consultation-cta";
import { useSitemapAnalysis } from "@/hooks/use-sitemap-analysis";
import { ErrorDisplay } from "@/components/error-display";

interface SitemapNode {
  url: string;
  title: string;
  depth: number;
  children: SitemapNode[];
  status: 'pending' | 'success' | 'error';
  lastModified?: string;
  priority?: number;
}

interface SitemapMainProps {
  url?: string;
}

export default function SitemapMain({ url: initialUrl = "" }: SitemapMainProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const {
    url,
    setUrl,
    loading,
    sitemap,
    expandedNodes,
    setExpandedNodes,
    countTotalPages,
    toggleNode,
    getDisplayedLinks,
    exportSitemap,
    runAnalysis,
    error,
    isRetrying,
    clearError,
  } = useSitemapAnalysis({ initialUrl, autoRun: !!initialUrl });

  // Function to collect all node URLs for auto-expansion
  const collectAllNodeUrls = (nodes: SitemapNode[]): string[] => {
    const urls: string[] = [];
    const traverse = (nodeList: SitemapNode[]) => {
      nodeList.forEach(node => {
        urls.push(node.url);
        if (node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    traverse(nodes);
    return urls;
  };

  const handleSubmit = async (e?: React.FormEvent) => { if (e) e.preventDefault(); await runAnalysis(); };

  // countTotalPages provided by hook


  // getDisplayedLinks provided by hook

  // toggleNode provided by hook

  const renderSitemapNode = (node: SitemapNode) => {
    const isExpanded = true; // Always show expanded
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.url} className="ml-4">
        <div className="flex items-center py-2 hover:bg-gray-50 rounded px-2">
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.url)}
              className="mr-2 p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}
          
          <div className="flex-1 flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              node.status === 'success' ? 'bg-green-500' : 
              node.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
            <span className="font-medium">{node.title}</span>
            <Badge variant="outline" className="text-xs">
              {t('sitemap.depth')} {node.depth}
            </Badge>
            {node.priority && (
              <Badge variant="secondary" className="text-xs">
                {t('sitemap.priority')}: {node.priority}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <a
              href={node.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div>
            {node.children.map(child => renderSitemapNode(child))}
          </div>
        )}
      </div>
    );
  };

  // exportSitemap provided by hook

  // XML generation handled in hook export

  const renderTableRow = (node: SitemapNode, depth: number = 0): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.url);
    
    return (
      <React.Fragment key={node.url}>
        <tr className={`border-b border-gray-100 hover:bg-gray-50 ${
          depth === 0 ? 'bg-palette-accent-3' : 
          depth === 1 ? 'bg-blue-50' : 
          depth === 2 ? 'bg-green-50' : 
          depth >= 3 ? 'bg-yellow-50' : ''
        }`}>
          <td className="p-4">
            <div className="flex items-center" style={{ paddingLeft: `${depth * 24}px` }}>
              {hasChildren && (
                <button
                  onClick={() => toggleNode(node.url)}
                  className="mr-2 p-1 hover:bg-gray-200 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
              {!hasChildren && <div className="w-6" />}
              
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  node.status === 'success' ? 'bg-green-500' : 
                  node.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className="font-medium text-sm">{node.title}</span>
              </div>
            </div>
          </td>
          <td className="p-4">
            <Badge 
              className={`text-xs ${
                node.status === 'success' ? 'bg-green-100 text-green-800' : 
                node.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {node.status === 'success' ? t('sitemap.success') : 
               node.status === 'error' ? t('sitemap.error') : t('sitemap.pending')}
            </Badge>
          </td>
          <td className="p-4">
            <Badge variant="outline" className="text-xs">
              {depth}
            </Badge>
          </td>
          <td className="p-4">
            {node.priority ? (
              <Badge variant="secondary" className="text-xs">
                {node.priority}
              </Badge>
            ) : (
              <span className="text-gray-400 text-xs">-</span>
            )}
          </td>
          <td className="p-4 text-right">
            <a
              href={node.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </td>
        </tr>
        {isExpanded && hasChildren && (
          <>
            {node.children.map(child => renderTableRow(child, depth + 1))}
          </>
        )}
      </React.Fragment>
    );
  };

  // When used in Site Audit (has initialUrl), show ONLY results
  if (initialUrl) {
    if (loading) {
      return (
        <div className="p-6">
          <div className="text-center py-8">
            <RefreshCw className="animate-spin h-12 w-12 text-palette-primary mx-auto mb-4" />
            <p className="text-slate-600">{t('sitemap.generatingFor', { url: initialUrl })}</p>
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
      const countNode = (n: SitemapNode): number => {
        return 1 + n.children.reduce((sum, child) => sum + countNode(child), 0);
      };
      return count + countNode(node);
    }, 0);

    return (
      <div className="p-6">
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-palette-accent-2/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Network className="h-6 w-6 text-palette-primary" />
                  {t('sitemap.sitemapStructure')}
                </h2>
                <p className="text-slate-600 mt-1">
                  {t('sitemap.foundPages', { count: totalPages })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  variant="outline"
                  className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {t('sitemap.reanalyze')}
                </Button>
                <Button
                  onClick={exportSitemap}
                  variant="outline"
                  className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('sitemap.export')}
                </Button>
              </div>
            </div>
          </div>

          {/* Sitemap Table */}
          <Card className="border-palette-accent-2/50 shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-purple-100">
                      <th className="text-left p-4 font-semibold text-slate-700">{t('sitemap.page')}</th>
                      <th className="text-left p-4 font-semibold text-slate-700">{t('sitemap.status')}</th>
                      <th className="text-left p-4 font-semibold text-slate-700">{t('sitemap.depth')}</th>
                      <th className="text-left p-4 font-semibold text-slate-700">{t('sitemap.priority')}</th>
                      <th className="text-right p-4 font-semibold text-slate-700">{t('sitemap.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sitemap.map((node) => renderTableRow(node))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section - Half size */}
      {!initialUrl && (
      <section className="relative min-h-[50vh] flex items-center justify-center bg-gradient-to-br from-palette-accent-2 via-palette-accent-1 to-palette-primary">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-10 opacity-35">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-palette-primary-hover rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-800 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse animation-delay-2000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-palette-primary rounded-full mix-blend-multiply filter blur-2xl opacity-55 animate-pulse animation-delay-4000"></div>
          </div>
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="mb-6">
            <Badge variant="outline" className="border-white/40 text-white bg-white/15 backdrop-blur-sm px-6 py-2 text-sm font-medium shadow-lg mb-6">
              <Network className="h-4 w-4 mr-2" />
              {t('sitemap.heroBadge')}
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('sitemap.heroTitle')}
          </h1>
          
          <p className="text-xl md:text-2xl text-purple-100 max-w-3xl mx-auto leading-relaxed mb-8">
            {t('sitemap.heroDescription')}
          </p>
          
          {/* URL Input in Hero Section */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30">
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder={t('sitemap.urlPlaceholder')}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="text-lg h-14 bg-white/90 border-0 rounded-xl px-4 placeholder:text-gray-500 focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading || !url}
                  className="bg-gradient-to-r from-palette-primary to-palette-primary-hover hover:from-purple-700 hover:to-palette-secondary text-white px-8 py-3 h-14 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      {t('sitemap.generating')}
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      {t('sitemap.analyze')}
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Error Display Section - Show on standalone page */}
      {!initialUrl && error && (
        <div className="bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3 py-16">
          <div className="container mx-auto px-4 max-w-7xl">
            <ErrorDisplay 
              error={error}
              onRetry={runAnalysis}
              onDismiss={clearError}
              isRetrying={isRetrying}
              variant="modal"
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="space-y-8">


          {/* Sitemap Analysis */}
          {sitemap.length > 0 && (
            <Card className="max-w-7xl mx-auto shadow-lg border-0 bg-gradient-to-r from-palette-accent-3 to-blue-50">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-palette-primary" />
                  {t('sitemap.sitemapAnalysis')}
                </CardTitle>
                <CardDescription className="text-gray-600 text-xl font-semibold">
                  {url}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Results */}
          {sitemap.length > 0 && (
            <Card className="border-palette-accent-2 shadow-xl">
              <div className="p-6">
                <CardTitle className="text-xl font-bold text-slate-800 text-center mb-2">{t('sitemap.sitemapStructure')}</CardTitle>
                <CardDescription className="text-slate-600 text-center mb-4">
                  {t('sitemap.totalPagesFound', { count: countTotalPages(sitemap) })}
                </CardDescription>
                <div className="flex justify-center gap-3 mb-6">
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    variant="outline"
                    className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {t('sitemap.reanalyze')}
                  </Button>
                  <Button 
                    onClick={exportSitemap} 
                    className="bg-gradient-to-r from-palette-primary to-palette-primary-hover hover:from-purple-700 hover:to-palette-secondary text-white px-6 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    {t('sitemap.exportXml')}
                  </Button>
                </div>
              </div>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-slate-200">
                      <tr>
                        <th className="text-left p-3 font-semibold text-slate-700">{t('sitemap.pageTitle')}</th>
                        <th className="text-center p-3 font-semibold text-slate-700 w-20">{t('sitemap.depth')}</th>
                        <th className="text-center p-3 font-semibold text-slate-700 w-24">{t('sitemap.priority')}</th>
                        <th className="text-center p-3 font-semibold text-slate-700 w-20">{t('sitemap.status')}</th>
                        <th className="text-center p-3 font-semibold text-slate-700 w-32">{t('sitemap.url')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getDisplayedLinks().map(node => {
                        const hasChildren = node.children && node.children.length > 0;
                        const isExpanded = expandedNodes.has(node.url);
                        const indentLevel = (node as any).displayDepth || 0;
                        
                        // Color coding based on depth
                        const getDepthColor = (depth: number) => {
                          const colors = [
                            'bg-blue-50 border-l-4 border-blue-400', // Depth 0
                            'bg-green-50 border-l-4 border-green-400', // Depth 1
                            'bg-palette-accent-3 border-l-4 border-palette-accent-2', // Depth 2
                            'bg-orange-50 border-l-4 border-orange-400', // Depth 3
                            'bg-pink-50 border-l-4 border-pink-400', // Depth 4+
                          ];
                          return colors[Math.min(depth, 4)];
                        };

                        return (
                          <tr key={node.url} className={`border-b border-slate-100 hover:bg-slate-50 ${getDepthColor(indentLevel)}`}>
                            <td className="p-3">
                              <div className="flex items-center gap-2" style={{ paddingLeft: `${indentLevel * 32}px` }}>
                                {hasChildren && (
                                  <button
                                    onClick={() => toggleNode(node.url)}
                                    className="p-1 hover:bg-gray-200 rounded mr-1 transition-colors"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-gray-600" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-gray-600" />
                                    )}
                                  </button>
                                )}
                                {!hasChildren && <div className="w-6" />}
                                
                                <div className={`w-2 h-2 rounded-full ${
                                  node.status === 'success' ? 'bg-green-500' : 
                                  node.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                                }`} />
                                <span className="font-medium text-gray-800">{node.title}</span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  indentLevel === 0 ? 'border-blue-400 text-blue-700 bg-blue-50' :
                                  indentLevel === 1 ? 'border-green-400 text-green-700 bg-green-50' :
                                  indentLevel === 2 ? 'border-palette-accent-2 text-palette-primary bg-palette-accent-3' :
                                  indentLevel === 3 ? 'border-orange-400 text-orange-700 bg-orange-50' :
                                  'border-pink-400 text-pink-700 bg-pink-50'
                                }`}
                              >
                                {node.depth}
                              </Badge>
                            </td>
                            <td className="p-3 text-center">
                              {node.priority && (
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${
                                    (node.priority ?? 0) >= 0.8 ? 'bg-green-100 text-green-800' :
                                    (node.priority ?? 0) >= 0.5 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {node.priority}
                                </Badge>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <Badge 
                                variant={node.status === 'success' ? 'default' : 'destructive'} 
                                className={`text-xs ${
                                  node.status === 'success' ? 'bg-green-100 text-green-800 border-green-200' :
                                  node.status === 'error' ? 'bg-red-100 text-red-800 border-red-200' :
                                  'bg-yellow-100 text-yellow-800 border-yellow-200'
                                }`}
                              >
                                {node.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-center">
                              <a
                                href={node.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features Grid - Only show when no results */}
          {sitemap.length === 0 && (
            <div className="grid md:grid-cols-3 gap-8 justify-items-center">
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">{t('sitemap.automaticCrawling')}</h3>
                  <p className="text-slate-600 mb-4">
                    {t('sitemap.automaticCrawlingDesc')}
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('sitemap.intelligentDiscovery')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('sitemap.completeMapping')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('sitemap.realtimeCrawling')}
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Network className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">{t('sitemap.visualStructure')}</h3>
                  <p className="text-slate-600 mb-4">
                    {t('sitemap.visualStructureDesc')}
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('sitemap.interactiveTree')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('sitemap.expandableNodes')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('sitemap.hierarchicalDisplay')}
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-palette-accent-1/5 to-palette-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 relative z-10">
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-palette-accent-1 to-palette-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Download className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-800">{t('sitemap.xmlExport')}</h3>
                  <p className="text-slate-600 mb-4">
                    {t('sitemap.xmlExportDesc')}
                  </p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('sitemap.standardXml')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('sitemap.seoToolCompatible')}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t('sitemap.searchEngineReady')}
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Call to Action Section - Only show after results */}
          {sitemap.length > 0 && (
            <ConsultationCTA
              title={t('sitemap.ctaTitle')}
              description={t('sitemap.ctaDescription')}
              secondaryButtonHref="/sitemap-info"
            />
          )}
        </div>
      </div>
    </div>
  );
}
