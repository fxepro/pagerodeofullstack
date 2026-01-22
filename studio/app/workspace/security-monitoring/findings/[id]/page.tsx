"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, AlertTriangle, CheckCircle2, Info, Shield, 
  ExternalLink, Calendar, User, FileText, Wrench
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
      // Try to refresh token
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

interface SecurityFinding {
  id: number;
  scan: number;
  scan_type: string;
  scan_target: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  status: 'new' | 'confirmed' | 'false_positive' | 'resolved' | 'mitigated';
  cve_id?: string;
  cvss_score?: number;
  affected_url: string;
  evidence: any;
  remediation: string;
  assigned_to?: number;
  assigned_to_name?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export default function FindingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const findingId = parseInt(params?.id as string);
  
  const [loading, setLoading] = useState(true);
  const [finding, setFinding] = useState<SecurityFinding | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (findingId) {
      loadFinding();
    }
  }, [findingId]);

  const loadFinding = async () => {
    try {
      setLoading(true);
      const apiBase = getApiBaseUrl();
      const data = await makeAuthenticatedRequest(`${apiBase}/api/security/findings/${findingId}/`);
      setFinding(data);
    } catch (error: any) {
      console.error('Error loading finding:', error);
      alert('Failed to load finding details: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const updateFindingStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      const apiBase = getApiBaseUrl();
      await makeAuthenticatedRequest(
        `${apiBase}/api/security/findings/${findingId}/`,
        'PATCH',
        { status: newStatus }
      );
      await loadFinding();
    } catch (error: any) {
      console.error('Error updating finding:', error);
      alert('Failed to update finding: ' + (error.message || 'Unknown error'));
    } finally {
      setUpdating(false);
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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'high': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'medium': return <Shield className="h-5 w-5 text-yellow-600" />;
      case 'low': return <Info className="h-5 w-5 text-blue-600" />;
      default: return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'default';
      case 'confirmed': return 'destructive';
      case 'false_positive': return 'secondary';
      case 'mitigated': return 'outline';
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
              <p className="text-muted-foreground">Loading finding details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!finding) {
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
              <p className="text-muted-foreground">Finding not found</p>
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
            <h1 className="text-h4-dynamic font-bold">{finding.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Security Finding Details
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getSeverityIcon(finding.severity)}
          <Badge variant={getSeverityColor(finding.severity) as any}>
            {finding.severity.toUpperCase()}
          </Badge>
          <Badge variant={getStatusColor(finding.status) as any}>
            {finding.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Status Actions */}
      {finding.status !== 'resolved' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Update Status:</span>
              {finding.status !== 'confirmed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFindingStatus('confirmed')}
                  disabled={updating}
                >
                  Mark as Confirmed
                </Button>
              )}
              {finding.status !== 'false_positive' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFindingStatus('false_positive')}
                  disabled={updating}
                >
                  Mark as False Positive
                </Button>
              )}
              {finding.status !== 'mitigated' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFindingStatus('mitigated')}
                  disabled={updating}
                >
                  Mark as Mitigated
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={() => updateFindingStatus('resolved')}
                disabled={updating}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Resolved
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{finding.description || 'No description provided.'}</p>
            </CardContent>
          </Card>

          {/* Evidence */}
          {finding.evidence && Object.keys(finding.evidence).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Evidence</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">
                  {JSON.stringify(finding.evidence, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Remediation */}
          {finding.remediation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Remediation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{finding.remediation}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Affected URL</p>
                <div className="flex items-center gap-2">
                  <a
                    href={finding.affected_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {finding.affected_url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {finding.scan_target && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Scan Target</p>
                  <p className="text-sm">{finding.scan_target}</p>
                </div>
              )}

              {finding.scan_type && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Scan Type</p>
                  <Badge variant="outline">{finding.scan_type}</Badge>
                </div>
              )}

              {finding.cve_id && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">CVE ID</p>
                  <p className="text-sm font-mono">{finding.cve_id}</p>
                </div>
              )}

              {finding.cvss_score !== null && finding.cvss_score !== undefined && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">CVSS Score</p>
                  <p className="text-sm font-bold">{finding.cvss_score}</p>
                </div>
              )}

              {finding.assigned_to_name && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{finding.assigned_to_name}</p>
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
                    {format(new Date(finding.created_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    {format(new Date(finding.updated_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              </div>

              {finding.resolved_at && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Resolved</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <p className="text-sm">
                      {format(new Date(finding.resolved_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/workspace/security-monitoring/${finding.scan}`)}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Scan Details
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

