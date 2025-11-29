"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Image as ImageIcon,
  Globe,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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

export default function DetailedMonitoringPage() {
  const params = useParams();
  const router = useRouter();
  
  // FIXED: safely get siteId as string even if params.siteId is string[]
  const siteIdParam = Array.isArray(params.siteId) 
    ? params.siteId[0] 
    : (params.siteId as string | undefined) ?? '';
  const numericSiteId = Number(siteIdParam);

  const [siteDetail, setSiteDetail] = useState<SiteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const linksPerPage = 20;

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
        // Generate mock response history (last 12 checks)
        // In production, this would come from the API
        const responseHistory = generateMockResponseHistory(link.status);
        
        try {
          const parsed = new URL(link.url);
          return {
            url: parsed.pathname + parsed.search,
            status: link.status,
            statusText: link.statusText || 'OK',
            responseTime: link.responseTime || 0,
            lastChecked: nowIso,
            screenshot: link.screenshot || null, // API should provide screenshot URL
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
    } catch (err) {
      console.warn('Failed to fetch site links:', err);
      return [];
    }
  };

  // Generate mock response history for demonstration
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

  const isLast12ChecksGreen = (responseHistory: number[] = []): boolean => {
    if (responseHistory.length === 0) return false;
    // Take last 12 checks (or all if less than 12)
    const last12 = responseHistory.slice(-12);
    // All should be 2xx status codes
    return last12.every(status => status >= 200 && status < 300);
  };

  const getScreenshotUrl = (linkUrl: string, siteUrl: string): string => {
    // In production, this would be an actual screenshot URL from the API
    // For now, return a placeholder or generate a screenshot service URL
    const fullUrl = linkUrl.startsWith('http') ? linkUrl : `https://${siteUrl}${linkUrl}`;
    // Using a screenshot service placeholder - replace with actual API endpoint
    return `https://api.screenshotone.com/take?access_key=YOUR_KEY&url=${encodeURIComponent(fullUrl)}&viewport_width=1280&viewport_height=720`;
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
          Your session has expired or you are not logged in. Please sign in to view detailed monitoring.
        </p>
        <Link href="/login" className="mt-4">
          <Button className="bg-palette-primary hover:bg-palette-primary-hover">Go to Login</Button>
        </Link>
      </div>
    );
  }

  if (!siteDetail) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <p className="text-slate-600 mb-4">{error || 'Site not found'}</p>
        <Link href="/dashboard/status-monitor">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Status Monitor
          </Button>
        </Link>
      </div>
    );
  }

  const paginatedLinks = siteDetail.siteLinks.slice(
    (currentPage - 1) * linksPerPage,
    currentPage * linksPerPage
  );

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href={`/dashboard/status-monitor/${siteDetail.id}`}>
        <Button variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Status Monitor
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Detailed Monitoring</h1>
          <p className="text-sm text-slate-600 mt-1">{siteDetail.url}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchSiteDetail(numericSiteId)}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Site Links Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Crawled Links ({siteDetail.siteLinks.length})</CardTitle>
            <div className="text-sm text-slate-600">
              Showing {Math.min((currentPage - 1) * linksPerPage + 1, siteDetail.siteLinks.length)}-{Math.min(currentPage * linksPerPage, siteDetail.siteLinks.length)} of {siteDetail.siteLinks.length}
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
              {paginatedLinks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                    No links found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLinks.map((link, index) => {
                  const fullUrl = link.url.startsWith('http') ? link.url : `https://${siteDetail.url}${link.url}`;
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
                            onClick={() => window.open(fullUrl, '_blank')}
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Link href={`/dashboard/detail-page-status/${encodeURIComponent(link.url)}?siteId=${siteDetail.id}&siteUrl=${encodeURIComponent(siteDetail.url)}`}>
                            <Button 
                              size="sm" 
                              variant="outline"
                              title="View page details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
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

