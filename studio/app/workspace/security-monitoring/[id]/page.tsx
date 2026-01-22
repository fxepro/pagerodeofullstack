"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, Activity, Eye, RefreshCw, CheckCircle2, XCircle, 
  Clock, Shield, AlertTriangle, ExternalLink, Calendar, User
} from 'lucide-react';
import { format } from 'date-fns';
import { getApiBaseUrl } from '@/lib/api-config';

// Helper function to refresh token
const refreshAccessToken = async () => {
  try {
    const apiBase = getApiBaseUrl();
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token');
    }
    const response = await fetch(`${apiBase}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (!response.ok) throw new Error('Token refresh failed');
    const data = await response.json();
    localStorage.setItem('access_token', data.access);
    return data.access;
  } catch (error) {
    console.error('Token refresh failed:', error);
    window.location.href = '/login';
    throw error;
  }
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url: string, method: string = 'GET', body?: any) => {
  let token = localStorage.getItem('access_token');
  
  const makeRequest = async (token: string) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    
    const options: RequestInit = {
      method,
      headers,
    };
    
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    
    if (response.status === 401) {
      const newToken = await refreshAccessToken();
      return makeRequest(newToken);
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}`);
    }
    
    return response.json();
  };
  
  if (!token) {
    token = await refreshAccessToken();
  }
  
  return makeRequest(token);
};

interface SecurityScan {
  id: number;
  scan_type: string;
  target_url: string;
  status: string;
  tool_used: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  created_by_name?: string;
}

interface SecurityFinding {
  id: number;
  title: string;
  severity: string;
  status: string;
  affected_url: string;
  created_at: string;
}

const SCAN_TYPES: Record<string, string> = {
  'dns_discovery': 'DNS/Subdomain Discovery',
  'port_scan': 'Port & Service Discovery',
  'vulnerability_scan': 'External Network / Host Vulnerability Scan',
  'dast': 'DAST (Automated Web App Scanning)',
  'misconfiguration_scan': 'Web-server Misconfiguration Scan',
  'ssl_check': 'TLS / SSL Configuration & Cert Checks',
  'cms_scan': 'CMS / Platform-specific Remote Scans',
  'sql_injection': 'SQL Injection / Targeted Exploit Checks',
  'headers_check': 'HTTP Security Headers & Basic Hardening Checks',
  'continuous_monitoring': 'Automated External Monitoring / Continuous Scanning',
  'manual_pentest': 'Manual Pentest Tools (Proxy & Manual Testing)',
};

export default function ScanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const scanId = parseInt(params?.id as string);
  
  const [loading, setLoading] = useState(true);
  const [scan, setScan] = useState<SecurityScan | null>(null);
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (scanId) {
      loadScan();
    }
  }, [scanId]);

  const loadScan = async () => {
    try {
      setLoading(true);
      const apiBase = getApiBaseUrl();
      const data = await makeAuthenticatedRequest(`${apiBase}/api/security/scans/${scanId}/`);
      setScan(data.scan);
      setFindings(data.findings || []);
      setSummary(data.summary || {});
    } catch (error: any) {
      console.error('Error loading scan:', error);
      alert('Failed to load scan details: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const runScan = async () => {
    try {
      setRunning(true);
      const apiBase = getApiBaseUrl();
      await makeAuthenticatedRequest(`${apiBase}/api/security/scans/${scanId}/run/`, 'POST');
      await loadScan();
    } catch (error: any) {
      console.error('Error running scan:', error);
      alert('Failed to run scan: ' + (error.message || 'Unknown error'));
    } finally {
      setRunning(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'running': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading scan details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Scan not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-h4-dynamic font-bold">Security Scan Details</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {SCAN_TYPES[scan.scan_type] || scan.scan_type}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(scan.status) as any}>
            {scan.status.toUpperCase()}
          </Badge>
          {scan.status === 'pending' && (
            <Button onClick={runScan} disabled={running}>
              <Activity className="h-4 w-4 mr-2" />
              {running ? 'Running...' : 'Run Scan'}
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{summary.total_findings || 0}</div>
              <p className="text-xs text-muted-foreground">Total Findings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{summary.critical || 0}</div>
              <p className="text-xs text-muted-foreground">Critical</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">{summary.high || 0}</div>
              <p className="text-xs text-muted-foreground">High</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{summary.medium || 0}</div>
              <p className="text-xs text-muted-foreground">Medium</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{summary.low || 0}</div>
              <p className="text-xs text-muted-foreground">Low</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Findings Table */}
          <Card>
            <CardHeader>
              <CardTitle>Findings ({findings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {findings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p>No findings found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {findings.map((finding) => (
                      <TableRow key={finding.id}>
                        <TableCell className="font-medium">{finding.title}</TableCell>
                        <TableCell>
                          <Badge variant={getSeverityColor(finding.severity) as any}>
                            {finding.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{finding.status}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          <a
                            href={finding.affected_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {finding.affected_url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (!finding.id || typeof finding.id !== 'number') {
                                console.error('Invalid finding ID:', finding);
                                alert('Cannot view finding: Invalid ID');
                                return;
                              }
                              router.push(`/workspace/security-monitoring/findings/${finding.id}`);
                            }}
                            title="View Finding Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Scan Details */}
          <Card>
            <CardHeader>
              <CardTitle>Scan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Target URL</p>
                <div className="flex items-center gap-2">
                  <a
                    href={scan.target_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {scan.target_url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Tool Used</p>
                <p className="text-sm">{scan.tool_used || 'N/A'}</p>
              </div>

              {scan.created_by_name && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created By</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{scan.created_by_name}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Created</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    {format(new Date(scan.created_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              </div>

              {scan.started_at && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Started</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">
                      {format(new Date(scan.started_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              )}

              {scan.completed_at && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Completed</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <p className="text-sm">
                      {format(new Date(scan.completed_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

