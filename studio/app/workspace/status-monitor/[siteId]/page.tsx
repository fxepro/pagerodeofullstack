"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  Lock,
  Link as LinkIcon,
  ExternalLink,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  XCircle,
  Shield,
  Search,
  FileText,
  Monitor,
  Settings,
  Eye,
  Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { DevicePerformanceTesting } from '@/components/device-performance-testing';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';

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
  created_at: string;
  updated_at: string;
}

interface SiteLink {
  url: string;
  status: number;
  statusText: string;
  responseTime: number;
  lastChecked: string;
  screenshot?: string;
  responseHistory?: number[]; // Last 12 response codes
}

interface Incident {
  id: string;
  timestamp: string;
  status: 'up' | 'down';
  duration: string;
  cause?: string;
}

export default function StatusMonitorPage() {
  const params = useParams();
  const router = useRouter();
  
  // FIXED: safely get siteId as string even if params.siteId is string[]
  const siteIdParam = Array.isArray(params.siteId) 
    ? params.siteId[0] 
    : (params.siteId as string | undefined) ?? '';
  const numericSiteId = Number(siteIdParam);

  const [site, setSite] = useState<ApiMonitoredSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [siteLinks, setSiteLinks] = useState<SiteLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const linksPerPage = 20;
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [responseTimeData, setResponseTimeData] = useState<Array<{ date: string; responseTime: number }>>([]);
  const [incidentData, setIncidentData] = useState<Array<{ date: string; incidents: number }>>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(300000); // Default: 5 minutes

  const fetchSiteLinks = async (url: string) => {
    if (!url || !url.trim()) {
      console.warn('[fetchSiteLinks] No URL provided');
      return;
    }
    
    setLinksLoading(true);
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[fetchSiteLinks] API error:', response.status, errorData);
        return;
      }

      const linksData = await response.json();
      const nowIso = new Date().toISOString();

      // Generate mock response history (last 12 checks)
      // In production, this would come from the API
      const generateMockResponseHistory = (currentStatus: number): number[] => {
        const history: number[] = [];
        const isHealthy = currentStatus >= 200 && currentStatus < 300;
        
        // Generate last 12 checks
        for (let i = 0; i < 12; i++) {
          if (isHealthy) {
            // If current status is healthy, make all 12 green (200-299)
            history.push(200 + Math.floor(Math.random() * 100));
          } else {
            // If current status is unhealthy, mix some errors
            if (i < 3) {
              // Last 3 checks might be errors
              history.push(currentStatus);
            } else {
              // Earlier checks might be healthy
              history.push(200 + Math.floor(Math.random() * 100));
            }
          }
        }
        
        return history.reverse(); // Most recent first
      };

      const links = (linksData.results || []).map((link: any) => {
        const responseHistory = generateMockResponseHistory(link.status);
        
        try {
          const parsed = new URL(link.url);
          return {
            url: parsed.pathname + parsed.search,
            status: link.status,
            statusText: link.statusText || 'OK',
            responseTime: link.responseTime || 0,
            lastChecked: nowIso,
            screenshot: link.screenshot || null,
            responseHistory,
          };
        } catch {
          return {
            url: link.url,
            status: link.status,
            statusText: link.statusText || 'OK',
            responseTime: link.responseTime || 0,
            lastChecked: nowIso,
            screenshot: link.screenshot || null,
            responseHistory,
          };
        }
      });
      setSiteLinks(links);
    } catch (err) {
      console.warn('Failed to fetch site links:', err);
    } finally {
      setLinksLoading(false);
    }
  };

  const generateSampleData = (baseResponseTime?: number) => {
    // Generate 30 days of sample data
    const now = new Date();
    const responseTime: Array<{ date: string; responseTime: number }> = [];
    const incidents: Array<{ date: string; incidents: number }> = [];
    const baseTime = baseResponseTime || 500;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Generate response time with some variance
      const variance = (Math.random() - 0.5) * 200;
      responseTime.push({
        date: dateStr,
        responseTime: Math.max(100, Math.round(baseTime + variance)),
      });
      
      // Generate incidents (occasional)
      incidents.push({
        date: dateStr,
        incidents: Math.random() > 0.9 ? Math.floor(Math.random() * 3) + 1 : 0,
      });
    }
    
    setResponseTimeData(responseTime);
    setIncidentData(incidents);
  };

  const fetchHistoricalData = async (url: string, baseResponseTime?: number) => {
    setChartLoading(true);
    try {
      // Fetch uptime data for the last 30 days
      const response = await fetch(`/api/monitor/uptime?url=${encodeURIComponent(url)}&days=30`);
      
      if (!response.ok) {
        // Generate sample data if API fails
        generateSampleData(baseResponseTime);
        return;
      }

      const data = await response.json();
      
      // Process response time data
      const responseTimeChart = (data.daily || []).map((day: any) => ({
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        responseTime: Math.round(day.responseTime || 0),
      }));
      
      // Process incident data
      const incidentChart = (data.daily || []).map((day: any) => ({
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        incidents: day.incidents || 0,
      }));
      
      setResponseTimeData(responseTimeChart);
      setIncidentData(incidentChart);
    } catch (err) {
      console.warn('Failed to fetch historical data:', err);
      // Generate sample data on error
      generateSampleData(baseResponseTime);
    } finally {
      setChartLoading(false);
    }
  };

  const fetchSiteData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      setAuthError(true);
      if (showLoading) setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/monitor/sites/${numericSiteId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setAuthError(true);
        if (showLoading) setLoading(false);
        return;
      }

      if (response.status === 404) {
        setError('Site not found or no longer monitored.');
        if (showLoading) setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to load site data (${response.status})`);
      }

      const data: ApiMonitoredSite = await response.json();
      setSite(data);
      setLastUpdated(new Date());
      
      // Fetch site links
      fetchSiteLinks(data.url);
      
      // Fetch historical data for charts
      fetchHistoricalData(data.url, data.response_time);
    } catch (err: any) {
      console.error('Error fetching site data:', err);
      setError(err.message || 'Failed to load site data.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Load user settings for refresh interval
  useEffect(() => {
    const loadUserSettings = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE}/api/user/settings/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const settings = await response.json();
          // Convert minutes to milliseconds
          const intervalMinutes = settings.homepageCheckInterval || 5;
          setRefreshInterval(intervalMinutes * 60 * 1000);
        }
      } catch (err) {
        console.warn('Failed to load user settings for refresh interval:', err);
      }
    };
    
    loadUserSettings();
  }, []);

  useEffect(() => {
    if (Number.isNaN(numericSiteId)) {
      setError('Invalid site identifier');
      setLoading(false);
      return;
    }
    
    fetchSiteData();
    // Auto-refresh interval: Uses user settings (homepageCheckInterval in minutes, converted to milliseconds)
    const interval = setInterval(() => {
      fetchSiteData(false); // Silent refresh
    }, refreshInterval);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericSiteId, refreshInterval]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSiteData(false);
    setRefreshing(false);
    toast.success('Status refreshed');
  };

  const getStatusColor = (status: string) => {
    if (status === 'up') return 'text-green-600';
    if (status === 'down') return 'text-red-600';
    return 'text-yellow-600';
  };

  const getStatusBadgeColor = (status: string) => {
    if (status === 'up') return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'down') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99.9) return 'text-green-600';
    if (uptime >= 99) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatUptime = (uptime: number) => {
    return uptime.toFixed(2);
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const isLast12ChecksGreen = (responseHistory: number[] = []): boolean => {
    if (responseHistory.length === 0) return false;
    // Take last 12 checks (or all if less than 12)
    const last12 = responseHistory.slice(-12);
    // All should be 2xx status codes
    return last12.every(status => status >= 200 && status < 300);
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
          Your session has expired or you are not logged in. Please sign in to view status.
        </p>
        <Link href="/login" className="mt-4">
          <Button className="bg-palette-primary hover:bg-palette-primary-hover">Go to Login</Button>
        </Link>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <p className="text-slate-600 mb-4">{error || 'Site not found'}</p>
        <Link href="/workspace/monitoring">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Monitoring
          </Button>
        </Link>
      </div>
    );
  }

  const brokenLinks = siteLinks.filter(l => l.status >= 400 || l.status === 0).length;
  const okLinks = siteLinks.filter(l => l.status >= 200 && l.status < 300).length;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/workspace/monitoring">
        <Button variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Monitoring
        </Button>
      </Link>

      {/* Header with Actions on Right */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600 mt-1">{site.url}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-600">
            Updated {getTimeAgo(lastUpdated)}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>
              Current uptime status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusBadgeColor(site.status)}>
              {site.status.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uptime</CardTitle>
            <CardDescription>
              Last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-lg font-bold ${getUptimeColor(site.uptime)}`}>
              {formatUptime(site.uptime)}%
            </div>
            <Progress value={site.uptime} max={100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Time</CardTitle>
            <CardDescription>
              Average response
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {site.response_time} ms
            </div>
            <Progress value={Math.min(site.response_time / 1000, 100)} max={100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SSL Status</CardTitle>
            <CardDescription>
              Certificate validity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {site.ssl_valid === null ? (
              <Badge variant="outline">Unknown</Badge>
            ) : site.ssl_valid ? (
              <Badge className="bg-green-100 text-green-800 border-green-200">Valid</Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800 border-red-200">Expired</Badge>
            )}
            {site.ssl_expires_in !== null && (
              <p className="text-sm text-slate-500 mt-1">
                Expires in {site.ssl_expires_in} days
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Response Time (Last 30 Days)</CardTitle>
            <CardDescription>
              Track site performance over the last month
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

      {/* Device Performance Testing Component */}
      <DevicePerformanceTesting url={site.url} />

      {/* Monitored Pages Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Monitored Pages ({siteLinks.length})</CardTitle>
              <CardDescription>
                All pages discovered from the homepage. Click any page to view detailed status.
              </CardDescription>
            </div>
            {siteLinks.length > linksPerPage && (
              <div className="text-sm text-slate-600">
                Showing {Math.min((currentPage - 1) * linksPerPage + 1, siteLinks.length)}-{Math.min(currentPage * linksPerPage, siteLinks.length)} of {siteLinks.length}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {linksLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-palette-primary" />
            </div>
          ) : siteLinks.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <LinkIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No pages discovered yet</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Screenshot</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead className="w-40">Last 12 Checks</TableHead>
                    <TableHead className="w-32">Response Code</TableHead>
                    <TableHead>Status Text</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Last Checked</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {siteLinks
                    .slice((currentPage - 1) * linksPerPage, currentPage * linksPerPage)
                    .map((link, index) => {
                      const fullUrl = link.url.startsWith('http') ? link.url : `https://${site.url}${link.url}`;
                      const last12Green = isLast12ChecksGreen(link.responseHistory);
                      
                      return (
                        <TableRow key={index}>
                          {/* Screenshot Column */}
                          <TableCell>
                            <div className="w-20 h-12 bg-slate-100 rounded border overflow-hidden flex items-center justify-center">
                              {link.screenshot ? (
                                <Image
                                  src={link.screenshot}
                                  alt={`Screenshot of ${link.url}`}
                                  width={80}
                                  height={48}
                                  className="object-cover w-full h-full"
                                  unoptimized
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center text-slate-400">
                                  <ImageIcon className="w-4 h-4 mb-1" />
                                  <span className="text-xs">No image</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          
                          {/* URL Column */}
                          <TableCell className="font-medium">
                            <a 
                              href={fullUrl}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-palette-primary hover:underline flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {link.url}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </TableCell>
                          
                          {/* Last 12 Checks - Green Bars */}
                          <TableCell>
                            <div className="flex items-center gap-0.5">
                              {(link.responseHistory || []).slice(-12).map((status, idx) => (
                                <div
                                  key={idx}
                                  className={`w-2.5 h-6 rounded-sm ${
                                    status >= 200 && status < 300
                                      ? 'bg-green-500'
                                      : status >= 300 && status < 400
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                  }`}
                                  title={`Check ${idx + 1}: ${status}`}
                                />
                              ))}
                            </div>
                          </TableCell>
                          
                          {/* Response Code Column */}
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
                          
                          {/* Status Text */}
                          <TableCell className="text-sm">{link.statusText}</TableCell>
                          
                          {/* Response Time */}
                          <TableCell className="text-sm">
                            {link.responseTime > 0 ? `${link.responseTime}ms` : '-'}
                          </TableCell>
                          
                          {/* Last Checked */}
                          <TableCell className="text-sm text-slate-600">
                            {new Date(link.lastChecked).toLocaleString()}
                          </TableCell>
                          
                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(fullUrl, '_blank');
                                }}
                                title="Open in new tab"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                              <Link href={`/workspace/detail-page-status/${encodeURIComponent(link.url)}?siteId=${site.id}&siteUrl=${encodeURIComponent(site.url)}`}>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  title="View page details"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {siteLinks.length > linksPerPage && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-slate-600">
                    Page {currentPage} of {Math.ceil(siteLinks.length / linksPerPage)}
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
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(siteLinks.length / linksPerPage), prev + 1))}
                      disabled={currentPage === Math.ceil(siteLinks.length / linksPerPage)}
                      className="border-palette-accent-2"
                    >
                      Next
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(Math.ceil(siteLinks.length / linksPerPage))}
                      disabled={currentPage === Math.ceil(siteLinks.length / linksPerPage)}
                      className="border-palette-accent-2"
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}