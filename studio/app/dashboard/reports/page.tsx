'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, RefreshCw, AlertCircle, CheckCircle, Clock, FileText, ExternalLink } from 'lucide-react';
import { applyTheme } from '@/lib/theme';

interface AuditReport {
  id: string;
  url: string;
  tools_selected: string[];
  tools_count: number;
  status: 'pending' | 'generating' | 'ready' | 'failed';
  audit_data?: {
    successful?: string[];
    failed?: string[];
    totalDuration?: number;
  };
  pdf_url?: string;
  file_size_mb?: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
  duration_seconds?: number;
}

interface Stats {
  total: number;
  pending: number;
  generating: number;
  ready: number;
  failed: number;
}

export default function Reports2Page() {
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, generating: 0, ready: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
    
    // Refresh when user switches back to this page
    const handleFocus = () => {
        fetchReports(true);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  async function fetchReports(silent = false) {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        // No token - show empty state instead of error
        setReports([]);
        setStats({ total: 0, pending: 0, generating: 0, ready: 0, failed: 0 });
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Use relative URL in production (browser), localhost in dev (SSR)
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');
      const response = await fetch(`${API_BASE}/api/reports/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired - redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = `/login?error=${encodeURIComponent('Your session has expired. Please log in again.')}`;
          return;
        } else if (response.status === 403) {
          setError('You do not have permission to view reports.');
        } else if (response.status === 404) {
          setError('Backend API not available. Reports require Django backend on port 8000.');
        } else if (response.status >= 500) {
          setError('Server error. Please try again later.');
        } else {
          setError(`Error loading reports: ${response.status} ${response.statusText}`);
        }
        setLoading(false);
        setRefreshing(false);
        return;
      }

        const data = await response.json();
        setReports(data);
      setError(null);
        
        // Fetch stats
      try {
        const statsResponse = await fetch(`${API_BASE}/api/reports/stats/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } catch (statsError) {
        console.error('Error fetching stats:', statsError);
        // Continue even if stats fail
      }
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      if (error.message?.includes('Failed to fetch')) {
        setError('Cannot connect to backend server. Make sure Django is running on port 8000.');
      } else {
        setError(error.message || 'Failed to load reports. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function deleteReport(id: string) {
    if (!confirm('Delete this audit record? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('access_token');
      // Use relative URL in production (browser), localhost in dev (SSR)
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');
      const response = await fetch(`${API_BASE}/api/reports/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchReports();
      }
    } catch (error) {
      console.error('Error deleting audit record:', error);
      }
  }


  const filteredReports = statusFilter === 'all'
    ? reports
    : statusFilter === 'completed'
    ? reports.filter(r => (r.audit_data?.successful?.length || 0) > 0)
    : statusFilter === 'errors'
    ? reports.filter(r => (r.audit_data?.failed?.length || 0) > 0)
    : reports;

  return (
    <div className="space-y-6">
      {/* Refresh Button Bar */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={() => fetchReports()}
          disabled={loading || refreshing}
          className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-medium">{error}</span>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setError(null)}
                className="ml-auto"
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
              <p className="text-sm text-slate-600 mt-1">Total Audits</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {reports.filter(r => (r.audit_data?.successful?.length || 0) > 0).length}
              </div>
              <p className="text-sm text-green-700 mt-1">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {reports.filter(r => (r.audit_data?.failed?.length || 0) > 0).length}
              </div>
              <p className="text-sm text-orange-700 mt-1">With Errors</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {[...new Set(reports.map(r => r.url))].length}
              </div>
              <p className="text-sm text-blue-700 mt-1">Unique Sites</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className={applyTheme.card()}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Filter:</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Audits</SelectItem>
                <SelectItem value="completed">Completed Only</SelectItem>
                <SelectItem value="errors">With Errors</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit History Table */}
      <Card className={applyTheme.card()}>
        <CardHeader>
          <CardTitle>Site Audit History</CardTitle>
          <CardDescription>
            {filteredReports.length} {filteredReports.length === 1 ? 'audit' : 'audits'} performed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-600">
              <RefreshCw className="h-8 w-8 animate-spin text-palette-primary mx-auto mb-2" />
              <p>Loading audit history...</p>
            </div>
          ) : filteredReports.length === 0 && !error ? (
            <div className="text-center py-12 text-slate-600">
              <FileText className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <p className="text-lg font-medium text-slate-700 mb-2">No audit history found</p>
              <p className="text-sm mt-1">Run an analysis from <strong>Site Audit</strong> to track your audits</p>
              <p className="text-xs text-slate-500 mt-2">
                {!localStorage.getItem('access_token') 
                  ? 'Log in to save and view audit history' 
                  : 'All completed audits will be automatically logged here'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Website URL</TableHead>
                  <TableHead>Successful</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => {
                  const successCount = report.audit_data?.successful?.length || 0;
                  const failedCount = report.audit_data?.failed?.length || 0;
                  
                  return (
                  <TableRow key={report.id}>
                      <TableCell className="font-medium max-w-xs">
                        <a 
                          href={`https://${report.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-palette-primary hover:underline flex items-center gap-1"
                        >
                      {report.url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                    </TableCell>
                    <TableCell>
                      {successCount > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {(report.audit_data?.successful || []).map((tool: string) => (
                            <Badge key={`${report.id}-success-${tool}`} className="bg-green-100 text-green-800 capitalize">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {tool}
                            </Badge>
                          ))}
                      </div>
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {failedCount > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {(report.audit_data?.failed || []).map((tool: string) => (
                            <Badge key={`${report.id}-failed-${tool}`} className="bg-red-100 text-red-800 capitalize">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-500" />
                        {new Date(report.created_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-500" />
                        {report.audit_data?.totalDuration
                          ? `${(report.audit_data.totalDuration / 1000).toFixed(2)}s`
                          : report.duration_seconds
                          ? `${report.duration_seconds.toFixed ? report.duration_seconds.toFixed(2) : report.duration_seconds}s`
                          : '-'}
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

