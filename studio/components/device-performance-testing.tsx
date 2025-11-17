"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Monitor,
  Smartphone,
  Tablet,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Zap,
  Clock,
  FileText
} from "lucide-react";
import { toast } from "sonner";

interface DeviceResult {
  device: 'desktop' | 'mobile' | 'tablet';
  performanceScore: number;
  metrics: {
    lcp: number;
    fid: number;
    cls: number;
    tti: number;
    tbt: number;
  };
  pageSize: number;
  requests: number;
  loadTime: number;
  issues: string[];
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    message: string;
    savings?: string;
  }>;
}

interface DevicePerformanceTestingProps {
  url: string;
}

export function DevicePerformanceTesting({ url }: DevicePerformanceTestingProps) {
  const [testing, setTesting] = useState<{
    desktop: boolean;
    mobile: boolean;
    tablet: boolean;
  }>({ desktop: false, mobile: false, tablet: false });

  const [results, setResults] = useState<{
    desktop: DeviceResult | null;
    mobile: DeviceResult | null;
    tablet: DeviceResult | null;
  }>({ desktop: null, mobile: null, tablet: null });

  const testDevice = async (device: 'desktop' | 'mobile' | 'tablet') => {
    setTesting(prev => ({ ...prev, [device]: true }));
    
    try {
      toast.info(`Testing ${device} performance...`);
      
      const response = await fetch('/api/analyze-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, device })
      });

      if (!response.ok) {
        // Try to extract error message from response
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`;
          }
        } catch {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText.length > 200 ? `${errorText.substring(0, 200)}...` : errorText;
            }
          } catch {
            // Ignore if we can't read the response
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setResults(prev => ({ ...prev, [device]: data }));
      toast.success(`${device.charAt(0).toUpperCase() + device.slice(1)} test complete`);
    } catch (error: any) {
      console.error(`${device} test failed:`, error);
      const errorMessage = error.message || 'Unknown error occurred';
      toast.error(`Failed to test ${device}: ${errorMessage}`);
    } finally {
      setTesting(prev => ({ ...prev, [device]: false }));
    }
  };

  const testAll = async () => {
    await testDevice('desktop');
    await testDevice('mobile');
    await testDevice('tablet');
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getMetricStatus = (metric: string, value: number) => {
    if (metric === 'lcp') {
      if (value <= 2.5) return { icon: CheckCircle, color: 'text-green-600' };
      if (value <= 4.0) return { icon: AlertTriangle, color: 'text-yellow-600' };
      return { icon: XCircle, color: 'text-red-600' };
    }
    if (metric === 'fid') {
      if (value <= 100) return { icon: CheckCircle, color: 'text-green-600' };
      if (value <= 300) return { icon: AlertTriangle, color: 'text-yellow-600' };
      return { icon: XCircle, color: 'text-red-600' };
    }
    if (metric === 'cls') {
      if (value <= 0.1) return { icon: CheckCircle, color: 'text-green-600' };
      if (value <= 0.25) return { icon: AlertTriangle, color: 'text-yellow-600' };
      return { icon: XCircle, color: 'text-red-600' };
    }
    return { icon: CheckCircle, color: 'text-green-600' };
  };

  const DeviceIcon = ({ device }: { device: 'desktop' | 'mobile' | 'tablet' }) => {
    if (device === 'desktop') return <Monitor className="h-5 w-5" />;
    if (device === 'mobile') return <Smartphone className="h-5 w-5" />;
    return <Tablet className="h-5 w-5" />;
  };

  const renderDeviceCard = (device: 'desktop' | 'mobile' | 'tablet') => {
    const isTesting = testing[device];
    const result = results[device];

    const deviceConfig = {
      desktop: { name: 'Desktop', color: 'blue', screen: '1920x1080' },
      mobile: { name: 'Mobile', color: 'green', screen: '375x667' },
      tablet: { name: 'Tablet', color: 'purple', screen: '768x1024' }
    }[device];

    return (
      <Card key={device} className={`border-${deviceConfig.color}-200 bg-${deviceConfig.color}-50/30`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DeviceIcon device={device} />
              <CardTitle className="text-lg">{deviceConfig.name}</CardTitle>
            </div>
            <Button
              size="sm"
              onClick={() => testDevice(device)}
              disabled={isTesting}
              className="bg-palette-primary hover:bg-palette-primary-hover text-white"
            >
              {isTesting ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Zap className="h-3 w-3 mr-1" />
              )}
              Test
            </Button>
          </div>
          <p className="text-xs text-slate-600 mt-1">{deviceConfig.screen}</p>
        </CardHeader>
        <CardContent>
          {isTesting ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-palette-primary mx-auto mb-2" />
              <p className="text-sm text-slate-600">Running Lighthouse...</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* Performance Score */}
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(result.performanceScore)}`}>
                  {result.performanceScore}
                </div>
                <Progress value={result.performanceScore} className="h-2 mt-2" />
                <p className="text-xs text-slate-600 mt-1">Performance Score</p>
              </div>

              {/* Core Web Vitals */}
              <div className="space-y-2 pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Largest Contentful Paint</span>
                  <div className="flex items-center gap-1">
                    {React.createElement(getMetricStatus('lcp', result.metrics.lcp).icon, {
                      className: `h-4 w-4 ${getMetricStatus('lcp', result.metrics.lcp).color}`
                    })}
                    <span className="font-medium">{result.metrics.lcp.toFixed(2)}s</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">First Input Delay</span>
                  <div className="flex items-center gap-1">
                    {React.createElement(getMetricStatus('fid', result.metrics.fid).icon, {
                      className: `h-4 w-4 ${getMetricStatus('fid', result.metrics.fid).color}`
                    })}
                    <span className="font-medium">{Math.round(result.metrics.fid)}ms</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Cumulative Layout Shift</span>
                  <div className="flex items-center gap-1">
                    {React.createElement(getMetricStatus('cls', result.metrics.cls).icon, {
                      className: `h-4 w-4 ${getMetricStatus('cls', result.metrics.cls).color}`
                    })}
                    <span className="font-medium">{result.metrics.cls.toFixed(3)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Time to Interactive</span>
                  <span className="font-medium">{result.metrics.tti.toFixed(2)}s</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Total Blocking Time</span>
                  <span className="font-medium">{Math.round(result.metrics.tbt)}ms</span>
                </div>
              </div>

              {/* Page Info */}
              <div className="pt-3 border-t text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Page Size:</span>
                  <span className="font-medium">{result.pageSize.toFixed(2)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Requests:</span>
                  <span className="font-medium">{result.requests}</span>
                </div>
                <div className="flex justify-between">
                  <span>Load Time:</span>
                  <span className="font-medium">{result.loadTime.toFixed(2)}s</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-600">
              <div className="mb-2">Not tested yet</div>
              <p className="text-xs">Click "Test" to analyze</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-palette-primary" />
              Multi-Device Performance Testing
            </CardTitle>
            <CardDescription className="mt-1">
              Test your website performance across different devices and screen sizes
            </CardDescription>
          </div>
          <Button
            onClick={testAll}
            disabled={testing.desktop || testing.mobile || testing.tablet}
            className="bg-gradient-to-r from-palette-primary to-palette-primary-hover text-white"
          >
            {(testing.desktop || testing.mobile || testing.tablet) ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Test All Devices
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Device Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {renderDeviceCard('desktop')}
          {renderDeviceCard('mobile')}
          {renderDeviceCard('tablet')}
        </div>

        {/* Comparison Table - Only show if at least 2 devices tested */}
        {(results.desktop && results.mobile) || (results.desktop && results.tablet) || (results.mobile && results.tablet) ? (
          <Card className="border-palette-accent-2/50">
            <CardHeader>
              <CardTitle className="text-lg">Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left p-3 text-sm font-semibold text-slate-700">Metric</th>
                      {results.desktop && <th className="text-center p-3 text-sm font-semibold text-slate-700">Desktop</th>}
                      {results.mobile && <th className="text-center p-3 text-sm font-semibold text-slate-700">Mobile</th>}
                      {results.tablet && <th className="text-center p-3 text-sm font-semibold text-slate-700">Tablet</th>}
                      {results.desktop && results.mobile && (
                        <th className="text-center p-3 text-sm font-semibold text-slate-700">Mobile Δ</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="p-3 font-medium">Performance Score</td>
                      {results.desktop && <td className="text-center p-3">{results.desktop.performanceScore}</td>}
                      {results.mobile && <td className="text-center p-3">{results.mobile.performanceScore}</td>}
                      {results.tablet && <td className="text-center p-3">{results.tablet.performanceScore}</td>}
                      {results.desktop && results.mobile && (
                        <td className="text-center p-3">
                          <Badge className={results.mobile.performanceScore < results.desktop.performanceScore ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                            {results.mobile.performanceScore - results.desktop.performanceScore > 0 ? '+' : ''}
                            {results.mobile.performanceScore - results.desktop.performanceScore}
                          </Badge>
                        </td>
                      )}
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="p-3 font-medium">Largest Contentful Paint</td>
                      {results.desktop && <td className="text-center p-3">{results.desktop.metrics.lcp.toFixed(2)}s</td>}
                      {results.mobile && <td className="text-center p-3">{results.mobile.metrics.lcp.toFixed(2)}s</td>}
                      {results.tablet && <td className="text-center p-3">{results.tablet.metrics.lcp.toFixed(2)}s</td>}
                      {results.desktop && results.mobile && (
                        <td className="text-center p-3">
                          <Badge className={results.mobile.metrics.lcp > results.desktop.metrics.lcp ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                            +{(results.mobile.metrics.lcp - results.desktop.metrics.lcp).toFixed(2)}s
                          </Badge>
                        </td>
                      )}
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="p-3 font-medium">First Input Delay</td>
                      {results.desktop && <td className="text-center p-3">{Math.round(results.desktop.metrics.fid)}ms</td>}
                      {results.mobile && <td className="text-center p-3">{Math.round(results.mobile.metrics.fid)}ms</td>}
                      {results.tablet && <td className="text-center p-3">{Math.round(results.tablet.metrics.fid)}ms</td>}
                      {results.desktop && results.mobile && (
                        <td className="text-center p-3">
                          <Badge className={results.mobile.metrics.fid > results.desktop.metrics.fid ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                            +{Math.round(results.mobile.metrics.fid - results.desktop.metrics.fid)}ms
                          </Badge>
                        </td>
                      )}
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="p-3 font-medium">Cumulative Layout Shift</td>
                      {results.desktop && <td className="text-center p-3">{results.desktop.metrics.cls.toFixed(3)}</td>}
                      {results.mobile && <td className="text-center p-3">{results.mobile.metrics.cls.toFixed(3)}</td>}
                      {results.tablet && <td className="text-center p-3">{results.tablet.metrics.cls.toFixed(3)}</td>}
                      {results.desktop && results.mobile && (
                        <td className="text-center p-3">
                          <Badge className={results.mobile.metrics.cls > results.desktop.metrics.cls ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                            +{(results.mobile.metrics.cls - results.desktop.metrics.cls).toFixed(3)}
                          </Badge>
                        </td>
                      )}
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="p-3 font-medium">Time to Interactive</td>
                      {results.desktop && <td className="text-center p-3">{results.desktop.metrics.tti.toFixed(2)}s</td>}
                      {results.mobile && <td className="text-center p-3">{results.mobile.metrics.tti.toFixed(2)}s</td>}
                      {results.tablet && <td className="text-center p-3">{results.tablet.metrics.tti.toFixed(2)}s</td>}
                      {results.desktop && results.mobile && (
                        <td className="text-center p-3">
                          <Badge className={results.mobile.metrics.tti > results.desktop.metrics.tti ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                            +{(results.mobile.metrics.tti - results.desktop.metrics.tti).toFixed(2)}s
                          </Badge>
                        </td>
                      )}
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Total Blocking Time</td>
                      {results.desktop && <td className="text-center p-3">{Math.round(results.desktop.metrics.tbt)}ms</td>}
                      {results.mobile && <td className="text-center p-3">{Math.round(results.mobile.metrics.tbt)}ms</td>}
                      {results.tablet && <td className="text-center p-3">{Math.round(results.tablet.metrics.tbt)}ms</td>}
                      {results.desktop && results.mobile && (
                        <td className="text-center p-3">
                          <Badge className={results.mobile.metrics.tbt > results.desktop.metrics.tbt ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                            +{Math.round(results.mobile.metrics.tbt - results.desktop.metrics.tbt)}ms
                          </Badge>
                        </td>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Mobile Issues - Only show if mobile tested */}
        {results.mobile && results.mobile.issues.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <div className="font-semibold text-yellow-800 mb-2">
                Mobile Performance Issues ({results.mobile.issues.length})
              </div>
              <ul className="space-y-1 text-sm text-yellow-700">
                {results.mobile.issues.slice(0, 5).map((issue, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-yellow-600">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Recommendations - Show if any device has recommendations */}
        {(results.desktop?.recommendations || results.mobile?.recommendations || results.tablet?.recommendations) && (
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Optimization Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  ...(results.mobile?.recommendations || []),
                  ...(results.desktop?.recommendations || []),
                  ...(results.tablet?.recommendations || [])
                ]
                  .filter((rec, index, self) => 
                    index === self.findIndex((r) => r.message === rec.message)
                  )
                  .sort((a, b) => {
                    const priority = { high: 0, medium: 1, low: 2 };
                    return priority[a.priority] - priority[b.priority];
                  })
                  .slice(0, 5)
                  .map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
                      <Badge className={
                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }>
                        {rec.priority.toUpperCase()}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm text-slate-800">{rec.message}</p>
                        {rec.savings && (
                          <p className="text-xs text-green-600 mt-1">
                            Potential savings: {rec.savings}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

