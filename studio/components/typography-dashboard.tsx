"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Type, RefreshCw, Activity, AlignLeft, FileText, Eye, Settings, XCircle, CheckCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CardDescription } from "@/components/ui/card";
import { useTypographyAnalysis } from "@/hooks/use-typography-analysis";
import { ErrorDisplay } from "@/components/error-display";

interface TypographyDashboardProps {
  url?: string;
}

export default function TypographyDashboard({ url: initialUrl = "" }: TypographyDashboardProps) {
  const { toast } = useToast();
  const { 
    isAnalyzing, 
    typographyData, 
    runAnalysis,
    error,
    isRetrying,
    clearError
  } = useTypographyAnalysis({ initialUrl, autoRun: !!initialUrl });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'google':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'custom':
        return 'bg-palette-accent-3 text-purple-800 border-palette-accent-2';
      case 'system':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getPerformanceStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600' };
    if (score >= 60) return { label: 'Good', color: 'text-blue-600' };
    if (score >= 40) return { label: 'Fair', color: 'text-yellow-600' };
    return { label: 'Poor', color: 'text-red-600' };
  };

  if (isAnalyzing) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <Activity className="animate-spin h-12 w-12 text-palette-primary mx-auto mb-4" />
          <p className="text-slate-600">Analyzing typography for {initialUrl}...</p>
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

  if (!typographyData) return null;

  return (
    <div className="p-6">
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-palette-accent-2/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Type className="h-6 w-6 text-palette-primary" />
                Typography Analysis for {typographyData.domain}
              </h2>
              <p className="text-slate-600 mt-1">Analyzed on {new Date(typographyData.timestamp).toLocaleString()}</p>
            </div>
            <Button onClick={runAnalysis} disabled={isAnalyzing} variant="outline" className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3">
              <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
              Re-analyze
            </Button>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-palette-accent-3/30">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl w-fit shadow-purple-200/50 shadow-lg">
                  <Type className="h-6 w-6 text-palette-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Font & Typography Summary</h3>
                  <p className="text-slate-600">Complete analysis of fonts and typography</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-palette-primary">
                  {typographyData.summary.overallScore}/100
                </div>
                <div className="text-sm text-slate-600">Overall Score</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-white rounded-lg border border-purple-100">
                <div className="text-3xl font-bold text-palette-primary">{typographyData.summary.totalFamilies}</div>
                <div className="text-sm text-slate-600 mt-1">Font Families</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
                <div className="text-3xl font-bold text-blue-600">{typographyData.summary.totalVariants}</div>
                <div className="text-sm text-slate-600 mt-1">Font Variants</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-orange-100">
                <div className="text-3xl font-bold text-orange-600">{typographyData.summary.totalSize}KB</div>
                <div className="text-sm text-slate-600 mt-1">Total Size</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-green-100">
                <div className="text-3xl font-bold text-green-600">{typographyData.summary.googleFonts}</div>
                <div className="text-sm text-slate-600 mt-1">Google Fonts</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-purple-100">
                <div className="text-3xl font-bold text-palette-primary">{typographyData.summary.customFonts}</div>
                <div className="text-sm text-slate-600 mt-1">Custom Fonts</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-indigo-100">
                <div className="text-3xl font-bold text-indigo-600">{typographyData.summary.loadTime}ms</div>
                <div className="text-sm text-slate-600 mt-1">Load Time</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FONTS SECTION */}
        <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50/30">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl w-fit shadow-blue-200/50 shadow-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Font Families</h3>
                  <CardDescription>All fonts loaded on this website</CardDescription>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                {typographyData.summary.totalFamilies} families
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-6">
              {typographyData.fonts.map((font, index) => (
                <div 
                  key={index}
                  className={`bg-gradient-to-br ${
                    font.source === 'google' ? 'from-blue-50 to-blue-100/50 border-blue-200/50' :
                    font.source === 'custom' ? 'from-palette-accent-3 to-palette-accent-3/50 border-palette-accent-2/50' :
                    'from-green-50 to-green-100/50 border-green-200/50'
                  } rounded-xl p-5 border`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Type className={`h-5 w-5 ${
                        font.source === 'google' ? 'text-blue-600' :
                        font.source === 'custom' ? 'text-palette-primary' :
                        'text-green-600'
                      }`} />
                      <h4 className="font-bold text-slate-800 text-lg">{font.family}</h4>
                    </div>
                    <Badge className={getSourceBadgeColor(font.source)}>
                      {font.source === 'google' ? 'Google Fonts' : 
                       font.source === 'custom' ? 'Custom' : 'System'}
                    </Badge>
                  </div>

                  {/* Variants */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-slate-600 mb-2">Variants:</div>
                    <div className="space-y-1">
                      {font.variants.map((variant, vIndex) => (
                        <div key={vIndex} className="text-xs text-slate-700 bg-white rounded px-2 py-1 font-mono">
                          {variant.weight} {variant.style !== 'normal' && `(${variant.style})`} - {variant.size}KB - {variant.format}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Used On */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-slate-600 mb-2">Used on:</div>
                    <div className="flex flex-wrap gap-1">
                      {font.usedOn.map((usage, uIndex) => (
                        <Badge key={uIndex} variant="outline" className="text-xs">
                          {usage}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>Display: <span className="font-mono text-slate-800">{font.settings.display}</span></div>
                    <div>Preload: <span className="font-mono text-slate-800">{font.settings.preload ? 'Yes' : 'No'}</span></div>
                    {font.settings.fallback && (
                      <div>Fallback: <span className="font-mono text-slate-800">{font.settings.fallback}</span></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* TYPOGRAPHY SECTION */}
        <Card className="border-palette-accent-2/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50/30">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl w-fit shadow-indigo-200/50 shadow-lg">
                  <AlignLeft className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Typography Hierarchy</h3>
                  <CardDescription>Text sizing and formatting structure</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Element</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Size</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Line Height</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Font</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(typographyData.typography).map(([element, styles], index) => (
                    <tr key={element} className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm font-semibold text-palette-primary">
                          {element.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-sm text-slate-700">{styles.size}</td>
                      <td className="py-3 px-4 font-mono text-sm text-slate-700">{styles.lineHeight}</td>
                      <td className="py-3 px-4 text-sm text-slate-700">{styles.fontFamily}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline" className="text-xs">{styles.count}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Issues */}
        {typographyData.issues.length > 0 && (
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" />
                Issues Found ({typographyData.issues.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {typographyData.issues.map((issue, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border border-red-200">
                    <div className="flex items-start gap-2">
                      <Badge className={
                        issue.severity === 'critical' ? 'bg-red-600 text-white' :
                        issue.severity === 'warning' ? 'bg-orange-500 text-white' :
                        'bg-blue-500 text-white'
                      }>
                        {issue.severity}
                      </Badge>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-800">{issue.message}</div>
                        <div className="text-xs text-slate-600 mt-1">{issue.impact}</div>
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



