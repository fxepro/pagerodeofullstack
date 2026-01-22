"use client";

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Clock,
  Activity,
  Globe,
  Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

interface PageStatus {
  url: string;
  fullUrl: string;
  status: number;
  statusText: string;
  responseTime: number;
  lastChecked: string;
  screenshot?: string;
  responseHistory: Array<{
    timestamp: string;
    status: number;
    responseTime: number;
  }>;
  uptime: number;
  incidents: number;
  averageResponseTime: number;
}

export default function DetailPageStatusPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  // FIXED: safely get pageId as string even if params.pageId is string[]
  const pageIdParam = Array.isArray(params.pageId) 
    ? params.pageId[0] 
    : (params.pageId as string | undefined) ?? '';
  const pageUrl = decodeURIComponent(pageIdParam);
  
  const siteId = searchParams.get('siteId');
  const siteUrl = searchParams.get('siteUrl') || '';
  const fullUrl = pageUrl.startsWith('http') ? pageUrl : `https://${siteUrl}${pageUrl}`;

  const [pageStatus, setPageStatus] = useState<PageStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [responseTimeData, setResponseTimeData] = useState<Array<{ date: string; responseTime: number }>>([]);
  const [incidentData, setIncidentData] = useState<Array<{ date: string; incidents: number }>>([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    fetchPageStatus();
  }, [pageUrl, siteId]);

  // Generate sample historical data for charts (last 30 days)
  const generateSampleData = (baseResponseTime: number = 200) => {
    const responseTimeChart: Array<{ date: string; responseTime: number }> = [];
    const incidentChart: Array<{ date: string; incidents: number }> = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Generate response time with some variation
      const responseTime = baseResponseTime + Math.floor(Math.random() * 300) - 100;
      responseTimeChart.push({
        date: dateStr,
        responseTime: Math.max(50, responseTime),
      });

      // Generate incidents (0-2 per day, with occasional spikes)
      const incidents = Math.random() > 0.85 ? Math.floor(Math.random() * 3) : 0;
      incidentChart.push({
        date: dateStr,
        incidents,
      });
    }

    setResponseTimeData(responseTimeChart);
    setIncidentData(incidentChart);
    setChartLoading(false);
  };

  const fetchHistoricalData = async (baseResponseTime: number = 200) => {
    setChartLoading(true);
    try {
      // In production, this would fetch from an API endpoint
      // For now, generate sample data
      generateSampleData(baseResponseTime);
    } catch (err) {
      console.warn('Failed to fetch historical data:', err);
      generateSampleData(baseResponseTime);
    }
  };

  const fetchPageStatus = async () => {
    setLoading(true);
    setError(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      setAuthError(true);
      setLoading(false);
      return;
    }

    try {
      // In production, this would fetch from an API endpoint like:
      // /api/monitor/pages/${pageId}/status
      // For now, we'll generate mock data based on the URL
      
      // Generate mock response history (last 30 checks)
      const responseHistory: Array<{ timestamp: string; status: number; responseTime: number }> = [];
      const now = new Date();
      
      for (let i = 29; i >= 0; i--) {
        const checkTime = new Date(now.getTime() - i * 60 * 60 * 1000); // Every hour
        responseHistory.push({
          timestamp: checkTime.toISOString(),
          status: Math.random() > 0.1 ? 200 : (Math.random() > 0.5 ? 500 : 404),
          responseTime: Math.floor(Math.random() * 500) + 100,
        });
      }

      const successfulChecks = responseHistory.filter(r => r.status >= 200 && r.status < 300).length;
      const uptime = (successfulChecks / responseHistory.length) * 100;
      const incidents = responseHistory.filter(r => r.status >= 400 || r.status === 0).length;
      const averageResponseTime = Math.round(
        responseHistory.reduce((sum, r) => sum + r.responseTime, 0) / responseHistory.length
      );

      // Get latest status
      const latest = responseHistory[responseHistory.length - 1];

      setPageStatus({
        url: pageUrl,
        fullUrl,
        status: latest.status,
        statusText: latest.status >= 200 && latest.status < 300 ? 'OK' : 'Error',
        responseTime: latest.responseTime,
        lastChecked: latest.timestamp,
        screenshot: undefined, // Would come from API
        responseHistory,
        uptime,
        incidents,
        averageResponseTime,
      });

      // Fetch historical data for charts
      fetchHistoricalData(latest.responseTime);
    } catch (err: any) {
      console.error('Error fetching page status:', err);
      setError(err.message || 'Failed to load page status.');
      setPageStatus(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-palette-primary" />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
        <p className="text-slate-600 max-w-md">
          Your session has expired or you are not logged in. Please sign in to view page status.
        </p>
        <Link href="/login" className="mt-4">
          <Button className="bg-palette-primary hover:bg-palette-primary-hover">Go to Login</Button>
        </Link>
      </div>
    );
  }

  if (!pageStatus) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <p className="text-slate-600 mb-4">{error || 'Page status not found'}</p>
        {siteId && (
          <Link href={`/dashboard/status-monitor/${siteId}`}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Site Monitoring
            </Button>
          </Link>
        )}
      </div>
    );
  }

  const last12Checks = pageStatus.responseHistory.slice(-12);
  const last12Green = last12Checks.every(check => check.status >= 200 && check.status < 300);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      {siteId && (
        <Link href={`/dashboard/status-monitor/${siteId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Site Monitoring
          </Button>
        </Link>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Page Status</h1>
          <p className="text-sm text-slate-600 mt-1">
            <a 
              href={pageStatus.fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-palette-primary hover:underline flex items-center gap-1"
            >
              {pageStatus.url}
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchPageStatus}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {pageStatus.status >= 200 && pageStatus.status < 300 ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600" />
              )}
              <Badge 
                className={
                  pageStatus.status >= 200 && pageStatus.status < 300 
                    ? 'bg-green-100 text-green-800' 
                    : pageStatus.status >= 300 && pageStatus.status < 400
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }
              >
                {pageStatus.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-600 mt-2">{pageStatus.statusText}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Uptime (30 checks)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {pageStatus.uptime.toFixed(1)}%
            </div>
            <p className="text-xs text-slate-600 mt-2">Last 30 checks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-palette-primary">
              {pageStatus.averageResponseTime}ms
            </div>
            <p className="text-xs text-slate-600 mt-2">Over last 30 checks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {pageStatus.incidents}
            </div>
            <p className="text-xs text-slate-600 mt-2">Last 30 checks</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Response Time (Last 30 Days)</CardTitle>
            <CardDescription>
              Track page performance over the last month
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-palette-primary" />
              </div>
            ) : (
              <LineChart
                width={500}
                height={250}
                data={responseTimeData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                <XAxis dataKey="date" />
                <YAxis />
                <Line type="monotone" dataKey="responseTime" stroke="#8884d8" />
              </LineChart>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Incidents (Last 30 Days)</CardTitle>
            <CardDescription>
              Number of downtime incidents per day
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-palette-primary" />
              </div>
            ) : (
              <BarChart width={500} height={250} data={incidentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Bar dataKey="incidents" fill="#82ca9d" />
              </BarChart>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Last 12 Checks Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Last 12 Checks</CardTitle>
          <CardDescription>Visual representation of the last 12 status checks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {last12Checks.map((check, idx) => (
                <div
                  key={idx}
                  className={`w-6 h-12 rounded-sm ${
                    check.status >= 200 && check.status < 300
                      ? 'bg-green-500'
                      : check.status >= 300 && check.status < 400
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  title={`Check ${idx + 1}: ${check.status} at ${new Date(check.timestamp).toLocaleString()}`}
                />
              ))}
            </div>
            <div className="ml-4">
              {last12Green ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">All 12 checks successful</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Some checks failed</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Screenshot */}
      <Card>
        <CardHeader>
          <CardTitle>Screenshot</CardTitle>
          <CardDescription>Latest screenshot of the page</CardDescription>
        </CardHeader>
        <CardContent>
          {pageStatus.screenshot ? (
            <div className="rounded-lg border overflow-hidden">
              <Image
                src={pageStatus.screenshot}
                alt={`Screenshot of ${pageStatus.url}`}
                width={1280}
                height={720}
                className="w-full h-auto"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
              <ImageIcon className="w-12 h-12 text-slate-400 mb-2" />
              <p className="text-slate-500">No screenshot available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Response History</CardTitle>
          <CardDescription>Last 30 status checks with timestamps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pageStatus.responseHistory.slice().reverse().map((check, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      check.status >= 200 && check.status < 300
                        ? 'bg-green-500'
                        : check.status >= 300 && check.status < 400
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          check.status >= 200 && check.status < 300
                            ? 'bg-green-100 text-green-800'
                            : check.status >= 300 && check.status < 400
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {check.status}
                      </Badge>
                      <span className="text-sm text-slate-600">{check.responseTime}ms</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(check.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

