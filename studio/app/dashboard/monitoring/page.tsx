"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Clock,
  Globe,
  Eye,
  Loader2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { captureEvent } from '@/lib/posthog';

// Use environment variable if set, otherwise default to localhost:8000 in development
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

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

interface MonitoredSite {
  id: number;
  url: string;
  status: 'up' | 'down' | 'checking';
  uptime: number;
  lastCheck: string | null;
  responseTime: number;
  statusDuration: string;
  checkInterval: number;
  sslValid?: boolean | null;
  sslExpiresIn?: number | null;
  errorMessage?: string | null;
}

interface SiteStatusData {
  status: 'up' | 'down' | 'checking';
  responseTime: number;
  lastCheck: string;
  uptime: number;
  statusDuration: string;
  sslValid?: boolean | null;
  sslExpiresIn?: number | null;
  errorMessage?: string | null;
}

const mapApiSite = (site: ApiMonitoredSite): MonitoredSite => ({
  id: site.id,
  url: site.url,
  status: site.status,
  uptime: site.uptime ?? 100,
  lastCheck: site.last_check,
  responseTime: site.response_time ?? 0,
  statusDuration: site.status_duration ?? '',
  checkInterval: site.check_interval ?? 5,
  sslValid: site.ssl_valid,
  sslExpiresIn: site.ssl_expires_in,
  errorMessage: site.error_message,
});

const applyStatusToSite = (site: MonitoredSite, status: SiteStatusData): MonitoredSite => ({
  ...site,
  status: status.status ?? site.status,
  responseTime: status.responseTime ?? site.responseTime,
  lastCheck: status.lastCheck ?? site.lastCheck,
  uptime: status.uptime ?? site.uptime,
  statusDuration: status.statusDuration ?? site.statusDuration,
  sslValid: status.sslValid ?? site.sslValid,
  sslExpiresIn: status.sslExpiresIn ?? site.sslExpiresIn,
  errorMessage: status.errorMessage ?? null,
});

export default function MonitoringPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [sites, setSites] = useState<MonitoredSite[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      setAuthError(true);
      setInitialLoading(false);
      return;
    }

    try {
      const url = `${API_BASE}/api/monitor/sites/`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setAuthError(true);
        setInitialLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(t('monitoring.noSites'));
      }

      const data: ApiMonitoredSite[] = await response.json();
      setSites(data.map(mapApiSite));
      setError(null);
    } catch (err: any) {
      console.error('Error loading monitored sites:', err);
      // Handle network errors (Failed to fetch)
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Unable to connect to the server. Please ensure the backend is running on ' + API_BASE);
      } else {
        setError(err.message || 'Failed to load monitored sites.');
      }
    } finally {
      setInitialLoading(false);
    }
  };

  const updateSiteOnServer = async (site: MonitoredSite) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;

    try {
      await fetch(`${API_BASE}/api/monitor/sites/${site.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: site.status,
          uptime: site.uptime,
          last_check: site.lastCheck,
          response_time: site.responseTime,
          status_duration: site.statusDuration,
          check_interval: site.checkInterval,
          ssl_valid: site.sslValid,
          ssl_expires_in: site.sslExpiresIn,
          error_message: site.errorMessage ?? '',
        }),
      });
    } catch (err) {
      console.warn('Failed to update site state on server:', err);
    }
  };

  const checkSiteStatus = async (url: string): Promise<SiteStatusData> => {
    try {
      const response = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const timestamp = data.timestamp || new Date().toISOString();
      const derivedUptime = typeof data.uptime === 'number' ? data.uptime : 99 + Math.random();

      return {
        status: data.status === 'up' ? 'up' : 'down',
        responseTime: data.responseTime || 0,
        lastCheck: timestamp,
        uptime: derivedUptime,
        statusDuration: data.status === 'up' ? 'Online' : 'Offline',
        sslValid: data.ssl?.valid ?? null,
        sslExpiresIn: data.ssl?.expiresIn ?? null,
        errorMessage: data.error || null,
      };
    } catch (err: any) {
      return {
        status: 'down',
        responseTime: 0,
        lastCheck: new Date().toISOString(),
        uptime: 0,
        statusDuration: 'Error',
        errorMessage: err.message || 'Failed to check status',
      };
    }
  };

  const handleAddSite = async () => {
    if (!newUrl.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      setAuthError(true);
      toast.error('Please log in to add sites.');
      return;
    }

    let cleanUrl = newUrl.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').toLowerCase();

    if (!cleanUrl) {
      toast.error('Please enter a valid URL');
      return;
    }

    if (sites.some((s) => s.url === cleanUrl)) {
      toast.error('Already monitoring this site');
      return;
    }

    setAdding(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/monitor/sites/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: cleanUrl }),
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setAuthError(true);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to add site (${response.status})`);
      }

      const createdSite = mapApiSite(await response.json());
      setSites((prev) => [...prev, createdSite]);
      setNewUrl('');
      toast.success(`Started monitoring ${cleanUrl}`);

      // Track monitoring site created
      captureEvent('monitoring_site_created', {
        site_id: createdSite.id,
        url: cleanUrl,
        timestamp: new Date().toISOString(),
      });

      const statusData = await checkSiteStatus(createdSite.url);
      const updatedSite = applyStatusToSite(createdSite, statusData);
      setSites((prev) => prev.map((s) => (s.id === updatedSite.id ? updatedSite : s)));
      await updateSiteOnServer(updatedSite);
    } catch (err: any) {
      console.error('Error adding site:', err);
      setError(err.message || 'Failed to add site');
      toast.error(err.message || 'Failed to add site. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteSite = async (id: number) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      setAuthError(true);
      return;
    }

    const site = sites.find((s) => s.id === id);
    if (!site) return;

    // Confirm deletion
    if (!confirm(`Are you sure you want to stop monitoring ${site.url}?`)) {
      return;
    }

    try {
      console.log(`[DeleteSite] Attempting to delete site ${id} (${site.url})`);
      const response = await fetch(`${API_BASE}/api/monitor/sites/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(`[DeleteSite] Response status: ${response.status} ${response.statusText}`);

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setAuthError(true);
        return;
      }

      // 204 No Content is success, 404 means already deleted (also success)
      if (response.status === 204 || response.status === 404) {
        console.log(`[DeleteSite] Successfully deleted site ${id}`);
        // Remove from state immediately
        setSites((prev) => prev.filter((s) => s.id !== id));
        toast.success(`Stopped monitoring ${site.url}`);
        
        // Refresh from server to ensure consistency
        await fetchSites();
        
        // Track monitoring site deleted
        captureEvent('monitoring_site_deleted', {
          site_id: id,
          url: site.url,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Get error message from response
        let errorMessage = `Failed to delete site (${response.status} ${response.statusText})`;
        let errorDetails: any = {};
        
        try {
          // Clone response to read it multiple times
          const responseClone = response.clone();
          const contentType = response.headers.get('content-type');
          
          if (contentType && contentType.includes('application/json')) {
            errorDetails = await response.json();
            errorMessage = errorDetails.error || errorDetails.detail || errorMessage;
            if (errorDetails.traceback) {
              console.error('[DeleteSite] Backend traceback:', errorDetails.traceback);
            }
          } else {
            const errorText = await responseClone.text();
            if (errorText) {
              try {
                errorDetails = JSON.parse(errorText);
                errorMessage = errorDetails.error || errorDetails.detail || errorMessage;
              } catch {
                errorMessage = errorText || errorMessage;
              }
            }
          }
        } catch (parseError) {
          console.error('[DeleteSite] Failed to parse error response:', parseError);
          // errorMessage already set above
        }
        
        console.error(`[DeleteSite] Delete failed:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          details: errorDetails,
          detail: errorDetails.detail,
          exception_type: errorDetails.exception_type,
          traceback: errorDetails.traceback
        });
        console.error(`[DeleteSite] Full error response:`, JSON.stringify(errorDetails, null, 2));
        
        // Show more detailed error message to user
        const userMessage = errorDetails.detail || errorDetails.error || errorMessage;
        throw new Error(userMessage);
      }
    } catch (err: any) {
      console.error('[DeleteSite] Error deleting site:', err);
      toast.error(err.message || 'Failed to delete site. Please try again.');
    }
  };

  const refreshSite = async (site: MonitoredSite) => {
    const statusData = await checkSiteStatus(site.url);
    const updatedSite = applyStatusToSite(site, statusData);
    setSites((prev) => prev.map((s) => (s.id === updatedSite.id ? updatedSite : s)));
    await updateSiteOnServer(updatedSite);
  };

  const handleRefresh = async () => {
    if (sites.length === 0) {
      toast.info('No sites to refresh');
      return;
    }

    setRefreshing(true);
    setError(null);

    try {
      await Promise.all(sites.map(refreshSite));
      toast.success('All sites refreshed successfully');
    } catch (err: any) {
      console.error('Error refreshing sites:', err);
      setError(err.message || 'Failed to refresh sites');
      toast.error('Failed to refresh some sites');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCheckOne = async (id: number) => {
    const site = sites.find((s) => s.id === id);
    if (!site) return;

    setSites((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'checking' } : s)));
    await refreshSite({ ...site, status: 'checking' });
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-palette-primary" />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
        <p className="text-slate-600 max-w-md">
          {t('errors.unauthorized')}
        </p>
        <Link href="/login" className="mt-4">
          <Button className="bg-palette-primary hover:bg-palette-primary-hover">{t('navigation.login')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Refresh Button Bar */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {t('common.update')}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{error}</span>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setError(null)}
                className="ml-auto"
              >
                {t('common.close')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add URL Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('monitoring.addSite')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={t('monitoring.siteUrl')}
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSite()}
                className="pl-10"
                disabled={adding}
              />
            </div>
            <Button 
              onClick={handleAddSite}
              disabled={adding || !newUrl.trim()}
              className="bg-palette-primary hover:bg-palette-primary-hover"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('monitoring.addSite')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-slate-800">
              {sites.length}
            </div>
            <p className="text-sm text-slate-600">{t('dashboard.totalSites')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {sites.filter(s => s.status === 'up').length}
            </div>
            <p className="text-sm text-slate-600">{t('monitoring.online')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {sites.filter(s => s.status === 'down').length}
            </div>
            <p className="text-sm text-slate-600">{t('monitoring.offline')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-palette-primary">
              {sites.length > 0 ? (sites.reduce((sum, s) => sum + s.uptime, 0) / sites.length).toFixed(1) : 0}%
            </div>
            <p className="text-sm text-slate-600">{t('monitoring.uptime')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Monitored Sites Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('monitoring.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {sites.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 text-slate-400" />
              <p>{t('monitoring.noSites')}</p>
              <p className="text-sm mt-1">{t('monitoring.addSite')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('dashboard.screenshot')}</TableHead>
                  <TableHead>{t('monitoring.status')}</TableHead>
                  <TableHead>{t('dashboard.website')}</TableHead>
                  <TableHead>{t('monitoring.uptime')}</TableHead>
                  <TableHead>{t('monitoring.responseTime')}</TableHead>
                  <TableHead>SSL</TableHead>
                  <TableHead>{t('monitoring.lastCheck')}</TableHead>
                  <TableHead className="text-center">{t('dashboard.detail')}</TableHead>
                  <TableHead className="text-right">{t('dashboard.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sites
                  .slice()
                  .sort((a, b) => (a.status === 'down' ? -1 : 1))
                  .map((site) => (
                    <TableRow 
                      key={site.id} 
                      className={`${site.status === 'down' ? 'bg-red-50' : site.status === 'checking' ? 'bg-blue-50' : ''} cursor-pointer hover:bg-slate-50 transition-colors`}
                      onClick={() => router.push(`/dashboard/status-monitor/${site.id}`)}
                    >
                      <TableCell>
                        <div className="relative w-24 h-16 bg-slate-100 rounded border border-slate-200 overflow-hidden">
                          {/* Placeholder for homepage screenshot */}
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                            <Globe className="h-6 w-6 text-slate-400" />
                          </div>
                          {/* TODO: Replace with actual screenshot when available */}
                          {/* <Image
                            src={`/api/screenshots/${site.id}`}
                            alt={`${site.url} screenshot`}
                            fill
                            className="object-cover"
                            unoptimized
                          /> */}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {site.status === 'checking' ? (
                            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                          ) : site.status === 'up' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          )}
                          <Badge className={
                            site.status === 'checking' ? 'bg-blue-100 text-blue-800' :
                            site.status === 'up' ? 'bg-green-100 text-green-800' : 
                            'bg-red-100 text-red-800'
                          }>
                            {site.status === 'up' ? t('monitoring.online') : 
                             site.status === 'down' ? t('monitoring.offline') : 
                             t('monitoring.unknown')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <a 
                            href={`https://${site.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-palette-primary hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {site.url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          {site.errorMessage && (
                            <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {site.errorMessage}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${site.status === 'up' ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${site.uptime}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{site.uptime.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {site.responseTime > 0 ? (
                          <span className={
                            site.responseTime < 500 ? 'text-green-600' :
                            site.responseTime < 1000 ? 'text-yellow-600' :
                            'text-red-600'
                          }>
                            {site.responseTime}ms
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {site.sslValid !== undefined ? (
                            site.sslValid ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-xs text-green-600">
                                  {site.sslExpiresIn ? `${site.sslExpiresIn}d` : 'Valid'}
                                </span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                <span className="text-xs text-yellow-600">Invalid</span>
                              </>
                            )
                          ) : (
                            <span className="text-xs text-slate-400">N/A</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">        
                        {site.lastCheck ? new Date(site.lastCheck).toLocaleTimeString() : t('common.never')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Link 
                          href={`/dashboard/status-monitor/${encodeURIComponent(site.id)}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckOne(site.id)}
                            disabled={site.status === 'checking'}
                            className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
                          >
                            <RefreshCw className={`w-3 h-3 mr-1 ${site.status === 'checking' ? 'animate-spin' : ''}`} />
                            {t('dashboard.checkNow')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSite(site.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

