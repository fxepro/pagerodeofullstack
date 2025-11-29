"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
} from 'lucide-react';
import Link from 'next/link';
import { DevicePerformanceTesting } from '@/components/device-performance-testing';
import { toast } from 'sonner';

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
  const siteIdParam = params.siteId as string;
  const numericSiteId = Number(siteIdParam);

  const [site, setSite] = useState<ApiMonitoredSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [siteLinks, setSiteLinks] = useState<SiteLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (Number.isNaN(numericSiteId)) {
      setError('Invalid site identifier');
      setLoading(false);
      return;
    }
    fetchSiteData();
    const interval = setInterval(() => {
      fetchSiteData(false); // Silent refresh
    }, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [numericSiteId]);

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
    } catch (err: any) {
      console.error('Error fetching site data:', err);
      setError(err.message || 'Failed to load site data.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchSiteLinks = async (url: string) => {
    setLinksLoading(true);
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        return;
      }

      const linksData = await response.json();
      const nowIso = new Date().toISOString();

      const links = (linksData.results || []).map((link: any) => {
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
      setSiteLinks(links);
    } catch (err) {
      console.warn('Failed to fetch site links:', err);
    } finally {
      setLinksLoading(false);
    }
  };

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
        <Link href="/dashboard/monitoring">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/monitoring">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Homepage Status</h1>
                <p className="text-sm text-slate-600">{site.url}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
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
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Overall Status Hero */}
        <Card className={`mb-6 border-0 shadow-lg ${
          site.status === 'up' 
            ? 'bg-gradient-to-r from-green-500 to-green-600' 
            : site.status === 'down'
            ? 'bg-gradient-to-r from-red-500 to-red-600'
            : 'bg-gradient-to-r from-yellow-500 to-yellow-600'
        }`}>
          <CardContent className="p-8 text-center text-white">
            <div className="flex flex-col items-center gap-4">
              {site.status === 'up' ? (
                <CheckCircle className="h-16 w-16" />
              ) : site.status === 'down' ? (
                <XCircle className="h-16 w-16" />
              ) : (
                <AlertTriangle className="h-16 w-16" />
              )}
              <div className="text-4xl font-bold">
                {site.status === 'up' ? 'OPERATIONAL' : site.status === 'down' ? 'DOWN' : 'CHECKING'}
              </div>
              <div className="flex items-center gap-8 mt-4">
                <div>
                  <div className="text-2xl font-bold">{formatUptime(site.uptime)}%</div>
                  <div className="text-sm opacity-90">Uptime (30d)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{site.response_time}ms</div>
                  <div className="text-sm opacity-90">Avg Response Time</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Status Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {site.status === 'up' ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                )}
                <Badge className={getStatusBadgeColor(site.status)}>
                  {site.status === 'up' ? 'Up' : site.status === 'down' ? 'Down' : 'Checking'}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                {site.last_check ? `Last checked: ${getTimeAgo(new Date(site.last_check))}` : 'Never checked'}
              </p>
            </CardContent>
          </Card>

          {/* Response Time Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-palette-primary">
                {site.response_time}ms
              </div>
              <p className="text-xs text-slate-600 mt-2">p95 response time</p>
            </CardContent>
          </Card>

          {/* SSL Certificate Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                SSL Certificate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {site.ssl_valid ? (
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
                {site.ssl_expires_in ? `Expires in ${site.ssl_expires_in} days` : 'N/A'}
              </p>
            </CardContent>
          </Card>

          {/* Links Discovered Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Links Discovered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">
                {siteLinks.length}
              </div>
              <p className="text-xs text-slate-600 mt-2">
                {brokenLinks > 0 ? `${brokenLinks} broken` : 'All links OK'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Error Message Display */}
        {site.error_message && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {site.error_message}
            </AlertDescription>
          </Alert>
        )}

        {/* Response Time Chart Placeholder */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Response Time Trend</CardTitle>
            <CardDescription>24-hour response time history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chart coming soon</p>
                <p className="text-sm">Historical data visualization</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Incident History Placeholder */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Incident History</CardTitle>
            <CardDescription>Last 10 incidents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-400">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No incidents recorded</p>
              <p className="text-sm">Incident timeline will appear here</p>
            </div>
          </CardContent>
        </Card>

        {/* SSL Certificate Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              SSL Certificate Details
            </CardTitle>
            <CardDescription>Certificate information and expiration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Status</span>
                <Badge className={site.ssl_valid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {site.ssl_valid ? 'Valid' : 'Invalid or Not Found'}
                </Badge>
              </div>
              {site.ssl_expires_in !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Expires In</span>
                  <span className="text-sm font-medium">
                    {site.ssl_expires_in} days
                    {site.ssl_expires_in < 30 && (
                      <Badge className="ml-2 bg-yellow-100 text-yellow-800">Expiring Soon</Badge>
                    )}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Link Discovery Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Link Discovery Status
            </CardTitle>
            <CardDescription>Crawl progress and discovered links</CardDescription>
          </CardHeader>
          <CardContent>
            {linksLoading ? (
              <div className="text-center py-4">
                <RefreshCw className="h-6 w-6 animate-spin text-palette-primary mx-auto mb-2" />
                <p className="text-sm text-slate-600">Discovering links...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-800">{siteLinks.length}</div>
                    <div className="text-sm text-slate-600">Total Links</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{okLinks}</div>
                    <div className="text-sm text-slate-600">OK (2xx)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{brokenLinks}</div>
                    <div className="text-sm text-slate-600">Broken</div>
                  </div>
                </div>
                {siteLinks.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-slate-600 mb-2">Sample links:</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {siteLinks.slice(0, 5).map((link, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Badge 
                            className={
                              link.status >= 200 && link.status < 300
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {link.status}
                          </Badge>
                          <span className="text-slate-600 truncate">{link.url}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* PageSpeed Multi-Device Analysis */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              PageSpeed Multi-Device Analysis
            </CardTitle>
            <CardDescription>Performance testing across desktop, mobile, and tablet</CardDescription>
          </CardHeader>
          <CardContent>
            <DevicePerformanceTesting url={site.url} />
          </CardContent>
        </Card>

        {/* SEO Health Check Placeholder */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              SEO Health Check
            </CardTitle>
            <CardDescription>Title, meta, canonical, robots.txt status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-400">
              <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>SEO analysis coming soon</p>
              <p className="text-sm">Basic SEO checks will appear here</p>
            </div>
          </CardContent>
        </Card>

        {/* API Endpoints Discovered Placeholder */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              API Endpoints Discovered
            </CardTitle>
            <CardDescription>JSON endpoints found from homepage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-400">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>API discovery coming soon</p>
              <p className="text-sm">Discovered endpoints will appear here</p>
            </div>
          </CardContent>
        </Card>

        {/* View Detailed Dashboard Button */}
        <div className="flex justify-center mb-8">
          <Link href={`/dashboard/monitoring/${site.id}`}>
            <Button size="lg" className="bg-palette-primary hover:bg-palette-primary-hover text-white">
              <Eye className="w-4 h-4 mr-2" />
              View Detailed Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

