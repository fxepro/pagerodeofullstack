"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Monitor,
  TrendingUp,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { DevicePerformanceTesting } from '@/components/device-performance-testing';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

interface ApiMonitoredSite {
  id: number;
  url: string;
  status: 'up' | 'down' | 'checking';
  uptime: number;
  last_check: string | null;
  response_time: number;
  status_duration: string;
  check_interval: number;
  ssl_valid: boolean | null;
  ssl_expires_in: number | null;
  error_message: string | null;
}

interface SiteLink {
  url: string;
  status: number;
  statusText: string;
  responseTime: number;
  lastChecked: string;
}

interface SiteDetail {
  id: number;
  url: string;
  status: 'up' | 'down' | 'checking';
  statusDuration: string;
  lastCheck: string | null;
  responseTime: number;
  sslValid?: boolean | null;
  sslExpiresIn?: number | null;
  errorMessage?: string | null;
  uptime: number;
  siteLinks: SiteLink[];
}

export default function MonitoringDetailPage() {
  const params = useParams();
  const router = useRouter();
  const siteIdParam = params.id as string;
  const numericSiteId = Number(siteIdParam);

  const [siteDetail, setSiteDetail] = useState<SiteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const linksPerPage = 20;
  
  // New state for historical data
  const [responseTimeData, setResponseTimeData] = useState<any[]>([]);
  const [uptimeData, setUptimeData] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    if (Number.isNaN(numericSiteId)) {
      setError('Invalid site identifier');
      setSiteDetail(null);
      setLoading(false);
      return;
    }
    setCurrentPage(1);
    fetchSiteDetail(numericSiteId);
  }, [numericSiteId]);

  // Fetch historical data when site is loaded
  useEffect(() => {
    if (siteDetail && siteDetail.id) {
      fetchHistoricalData(siteDetail.id);
      fetchUptimeData(siteDetail.id);
      fetchIncidents(siteDetail.id);
      fetchStats(siteDetail.id);
    }
  }, [siteDetail?.id]);

  const fetchSiteDetail = async (siteId: number) => {
    setLoading(true);
    setError(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      setAuthError(true);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/monitor/sites/${siteId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setAuthError(true);
        setLoading(false);
        return;
      }

      if (response.status === 404) {
        setSiteDetail(null);
        setError('Site not found or no longer monitored.');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to load monitoring detail (${response.status})`);
      }

      const site: ApiMonitoredSite = await response.json();
      const siteLinks = await fetchSiteLinks(site.url);

      setSiteDetail({
        id: site.id,
        url: site.url,
        status: site.status,
        statusDuration: site.status_duration || '',
        lastCheck: site.last_check,
        responseTime: site.response_time ?? 0,
        sslValid: site.ssl_valid,
        sslExpiresIn: site.ssl_expires_in,
        errorMessage: site.error_message,
        uptime: site.uptime ?? 0,
        siteLinks,
      });
    } catch (err: any) {
      console.error('Error fetching site detail:', err);
      setError(err.message || 'Failed to load site details.');
      setSiteDetail(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalData = async (siteId: number) => {
    setChartLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/monitor/sites/${siteId}/history/?days=30`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Format data for chart
          const chartData = data.data.map((check: any) => ({
            date: new Date(check.checked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            responseTime: check.response_time,
            status: check.status,
          }));
          setResponseTimeData(chartData);
        }
      }
    } catch (err) {
      console.error('Failed to fetch historical data:', err);
    } finally {
      setChartLoading(false);
    }
  };

  const fetchUptimeData = async (siteId: number) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/monitor/sites/${siteId}/uptime/?period=all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUptimeData(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch uptime data:', err);
    }
  };

  const fetchIncidents = async (siteId: number) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/monitor/sites/${siteId}/incidents/?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.incidents) {
          setIncidents(data.incidents);
        }
      }
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    }
  };

  const fetchStats = async (siteId: number) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/monitor/sites/${siteId}/stats/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchSiteLinks = async (url: string): Promise<SiteLink[]> => {
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        return [];
      }

      const linksData = await response.json();
      const nowIso = new Date().toISOString();

      return (linksData.results || []).map((link: any) => {
        try {
          const parsed = new URL(link.url);
          return {
            url: parsed.pathname + parsed.search,
            status: link.status,
            statusText: link.statusText || 'OK',
            responseTime: link.responseTime || 0,
            lastChecked: nowIso,
          };
        } catch {
          return {
            url: link.url,
            status: link.status,
            statusText: link.statusText || 'OK',
            responseTime: link.responseTime || 0,
            lastChecked: nowIso,
          };
        }
      });
    } catch (err) {
      console.warn('Failed to fetch site links:', err);
      return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-palette-primary" />
      </div>
    );
  }

  if (!siteDetail) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Site not found</p>
        <Link href="/dashboard/monitoring">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Monitoring
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/dashboard/monitoring">
        <Button variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Monitoring
        </Button>
      </Link>

      {/* Header Stats Cards - Real Data Only */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Current Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {siteDetail.status === 'up' ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600" />
              )}
              <div className={`text-2xl font-bold ${siteDetail.status === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {siteDetail.status === 'up' ? 'Up' : 'Down'}
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              {siteDetail.statusDuration}
            </p>
          </CardContent>
        </Card>

        {/* Response Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-palette-primary">
              {siteDetail.responseTime}ms
            </div>
            <p className="text-xs text-slate-600 mt-2">
              Last measured
            </p>
          </CardContent>
        </Card>

        {/* SSL Certificate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">SSL Certificate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {siteDetail.sslValid ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <Badge className="bg-green-100 text-green-800">Valid</Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <Badge className="bg-yellow-100 text-yellow-800">Invalid</Badge>
                </>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-2">
              {siteDetail.sslExpiresIn ? `Expires in ${siteDetail.sslExpiresIn} days` : 'N/A'}
            </p>
          </CardContent>
        </Card>

        {/* Last Check */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Last Check</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {siteDetail.lastCheck ? new Date(siteDetail.lastCheck).toLocaleTimeString() : 'Never'}
            </div>
            <p className="text-xs text-slate-600 mt-2">
              {siteDetail.lastCheck ? new Date(siteDetail.lastCheck).toLocaleDateString() : 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Message Display */}
      {siteDetail.errorMessage && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-medium">{siteDetail.errorMessage}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uptime Percentages */}
      {uptimeData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Uptime (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">
                {uptimeData.uptime_24h?.toFixed(3) || '100.000'}%
              </div>
              <p className="text-xs text-slate-600 mt-2">
                {uptimeData.total_checks_24h || 0} checks
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Uptime (7d)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">
                {uptimeData.uptime_7d?.toFixed(3) || '100.000'}%
              </div>
              <p className="text-xs text-slate-600 mt-2">
                {uptimeData.total_checks_7d || 0} checks
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Uptime (30d)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">
                {uptimeData.uptime_30d?.toFixed(3) || '100.000'}%
              </div>
              <p className="text-xs text-slate-600 mt-2">
                {uptimeData.total_checks_30d || 0} checks
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Response Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Response Time History (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-palette-primary" />
            </div>
          ) : responseTimeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="date" 
                  stroke="#666"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#666"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Response Time (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-slate-500">
              No historical data available yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">
                {stats.avg_response_time || 0}ms
              </div>
              <p className="text-xs text-slate-600 mt-2">Last 30 days</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Min / Max</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">
                {stats.min_response_time || 0}ms / {stats.max_response_time || 0}ms
              </div>
              <p className="text-xs text-slate-600 mt-2">Last 30 days</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">
                {stats.total_checks || 0}
              </div>
              <p className="text-xs text-slate-600 mt-2">Last 30 days</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Incidents Table */}
      {incidents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Resolved</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Root Cause</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident: any) => (
                  <TableRow key={incident.id}>
                    <TableCell>
                      <Badge 
                        className={
                          incident.status === 'resolved' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {incident.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(incident.started_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {incident.resolved_at 
                        ? new Date(incident.resolved_at).toLocaleString()
                        : 'Ongoing'
                      }
                    </TableCell>
                    <TableCell>
                      {incident.duration_minutes 
                        ? `${incident.duration_minutes} minutes`
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {incident.root_cause || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Device Performance Testing Section Header */}
      <div className="flex items-center gap-3 mt-8 mb-4">
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-palette-primary" />
          <h2 className="text-xl font-bold text-slate-800 font-montserrat">Device Performance Testing</h2>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-slate-300 to-transparent"></div>
      </div>

      {/* Mobile Device Testing Section - NEW */}
      <DevicePerformanceTesting url={siteDetail.url} />

      {/* Site Links Section Header */}
      {siteDetail.siteLinks.length > 0 && (
        <div className="flex items-center gap-3 mt-8 mb-4">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-palette-primary" />
            <h2 className="text-xl font-bold text-slate-800 font-montserrat">Site Links Analysis</h2>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-slate-300 to-transparent"></div>
        </div>
      )}

      {/* Site Links Summary Stats */}
      {siteDetail.siteLinks.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Total Pages */}
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-800">
                  {siteDetail.siteLinks.length}
                </div>
                <p className="text-sm text-slate-600 mt-1">Total Pages</p>
              </div>
            </CardContent>
          </Card>

          {/* Pages OK (200) */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {siteDetail.siteLinks.filter(l => l.status >= 200 && l.status < 300).length}
                </div>
                <p className="text-sm text-green-700 mt-1">OK (2xx)</p>
              </div>
            </CardContent>
          </Card>

          {/* Redirects (3xx) */}
          {siteDetail.siteLinks.filter(l => l.status >= 300 && l.status < 400).length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {siteDetail.siteLinks.filter(l => l.status >= 300 && l.status < 400).length}
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">Redirects (3xx)</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Client Errors (4xx) */}
          {siteDetail.siteLinks.filter(l => l.status >= 400 && l.status < 500).length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {siteDetail.siteLinks.filter(l => l.status >= 400 && l.status < 500).length}
                  </div>
                  <p className="text-sm text-orange-700 mt-1">
                    Errors (4xx)
                    {siteDetail.siteLinks.filter(l => l.status === 404).length > 0 && (
                      <span className="block text-xs">
                        {siteDetail.siteLinks.filter(l => l.status === 404).length} Not Found
                      </span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Server Errors (5xx) */}
          {siteDetail.siteLinks.filter(l => l.status >= 500).length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {siteDetail.siteLinks.filter(l => l.status >= 500).length}
                  </div>
                  <p className="text-sm text-red-700 mt-1">Server Errors (5xx)</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Network Errors (0) */}
          {siteDetail.siteLinks.filter(l => l.status === 0).length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {siteDetail.siteLinks.filter(l => l.status === 0).length}
                  </div>
                  <p className="text-sm text-red-700 mt-1">Network Errors</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Site Links Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Site Links ({siteDetail.siteLinks.length})</CardTitle>
            <div className="text-sm text-slate-600">
              Showing {Math.min((currentPage - 1) * linksPerPage + 1, siteDetail.siteLinks.length)}-{Math.min(currentPage * linksPerPage, siteDetail.siteLinks.length)} of {siteDetail.siteLinks.length}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Status Text</TableHead>
                <TableHead>Response Time</TableHead>
                <TableHead>Last Checked</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {siteDetail.siteLinks
                .slice((currentPage - 1) * linksPerPage, currentPage * linksPerPage)
                .map((link, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <a 
                      href={link.url.startsWith('http') ? link.url : `https://${siteDetail.url}${link.url}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-palette-primary hover:underline flex items-center gap-1"
                    >
                      {link.url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={
                        link.status >= 200 && link.status < 300 
                          ? 'bg-green-100 text-green-800' 
                          : link.status >= 300 && link.status < 400
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {link.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{link.statusText}</TableCell>
                  <TableCell className="text-sm">
                    {link.responseTime > 0 ? `${link.responseTime}ms` : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {new Date(link.lastChecked).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(
                        link.url.startsWith('http') ? link.url : `https://${siteDetail.url}${link.url}`,
                        '_blank'
                      )}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {siteDetail.siteLinks.length > linksPerPage && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-slate-600">
                Page {currentPage} of {Math.ceil(siteDetail.siteLinks.length / linksPerPage)}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="border-palette-accent-2"
                >
                  First
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-palette-accent-2"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(siteDetail.siteLinks.length / linksPerPage), prev + 1))}
                  disabled={currentPage === Math.ceil(siteDetail.siteLinks.length / linksPerPage)}
                  className="border-palette-accent-2"
                >
                  Next
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(Math.ceil(siteDetail.siteLinks.length / linksPerPage))}
                  disabled={currentPage === Math.ceil(siteDetail.siteLinks.length / linksPerPage)}
                  className="border-palette-accent-2"
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

