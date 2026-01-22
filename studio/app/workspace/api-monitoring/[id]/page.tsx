"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { applyTheme } from "@/lib/theme";
import { getApiBaseUrl } from "@/lib/api-config";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Play,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Info,
} from "lucide-react";
// Import the helper function - we'll define it here since we can't import from page.tsx easily
import axios from "axios";

// Helper function to refresh token
const refreshAccessToken = async (): Promise<string | null> => {
  const apiBase = getApiBaseUrl();
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    return null;
  }
  
  try {
    const res = await axios.post(`${apiBase}/api/token/refresh/`, {
      refresh: refreshToken,
    });
    const newAccessToken = res.data.access;
    localStorage.setItem("access_token", newAccessToken);
    if (res.data.refresh) {
      localStorage.setItem("refresh_token", res.data.refresh);
    }
    return newAccessToken;
  } catch (err) {
    console.error("Token refresh failed:", err);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    return null;
  }
};

// Helper function to make authenticated request with automatic token refresh
const makeAuthenticatedRequest = async (
  url: string, 
  method: string = 'GET', 
  data?: any
): Promise<any> => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("No access token available");
  }

  const config: any = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    let response;
    if (method === 'GET') {
      response = await axios.get(url, config);
    } else if (method === 'POST') {
      response = await axios.post(url, data, config);
    } else if (method === 'PUT') {
      response = await axios.put(url, data, config);
    } else if (method === 'DELETE') {
      response = await axios.delete(url, config);
    } else {
      throw new Error(`Unsupported method: ${method}`);
    }
    return response;
  } catch (err: any) {
    // If 401, try to refresh token and retry
    if (err.response?.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
        // Retry the request with new token
        if (method === 'GET') {
          return await axios.get(url, config);
        } else if (method === 'POST') {
          return await axios.post(url, data, config);
        } else if (method === 'PUT') {
          return await axios.put(url, data, config);
        } else if (method === 'DELETE') {
          return await axios.delete(url, config);
        }
      }
      // Refresh failed, redirect to login
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/workspace/login";
      throw err;
    }
    throw err;
  }
};

interface EndpointDetail {
  endpoint: {
    id: number;
    name: string;
    url: string;
    method: string;
    expected_status_code: number;
    timeout_seconds: number;
    check_interval_minutes: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  checks: Array<{
    id: number;
    status_code: number | null;
    response_time_ms: number;
    is_success: boolean;
    error_message: string | null;
    checked_at: string;
  }>;
  alerts: Array<{
    id: number;
    alert_type: string;
    message: string;
    is_resolved: boolean;
    created_at: string;
    api_check: {
      status_code: number | null;
      response_time_ms: number;
      error_message: string | null;
      checked_at: string;
    };
  }>;
  statistics: {
    total_checks: number;
    successful_checks: number;
    failed_checks: number;
    success_rate: number;
    avg_response_time_ms: number;
    checks_24h: {
      total: number;
      successful: number;
      failed: number;
      success_rate: number;
    };
    active_alerts: number;
  };
}

export default function EndpointDetailPage() {
  const router = useRouter();
  const params = useParams();
  const endpointId = params?.id as string;

  const [data, setData] = useState<EndpointDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (endpointId) {
      fetchEndpointDetail();
    }
  }, [endpointId]);

  const fetchEndpointDetail = async () => {
    setLoading(true);
    try {
      const apiBase = getApiBaseUrl();
      const response = await makeAuthenticatedRequest(
        `${apiBase}/api/admin-tools/endpoints/${endpointId}/`,
        'GET'
      );
      setData(response.data);
    } catch (error: any) {
      console.error("Error fetching endpoint detail:", error);
      alert('Failed to load endpoint details: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const testEndpoint = async () => {
    setTesting(true);
    try {
      const apiBase = getApiBaseUrl();
      await makeAuthenticatedRequest(
        `${apiBase}/api/admin-tools/endpoints/${endpointId}/test/`,
        'POST',
        {}
      );
      await fetchEndpointDetail(); // Refresh data
    } catch (error: any) {
      console.error("Error testing endpoint:", error);
      alert('Failed to test endpoint: ' + (error.response?.data?.error || error.message));
    } finally {
      setTesting(false);
    }
  };

  const getAlertReason = (alert: EndpointDetail['alerts'][0]) => {
    const check = alert.api_check;
    const endpoint = data?.endpoint;
    
    if (!endpoint) return alert.message;
    
    switch (alert.alert_type) {
      case 'down':
        return `Endpoint is down or unreachable. ${check.error_message || 'Connection failed.'}`;
      case 'timeout':
        return `Request timed out after ${endpoint.timeout_seconds}s. The endpoint took longer than the configured timeout.`;
      case 'unexpected_status':
        return `Expected status ${endpoint.expected_status_code}, but got ${check.status_code}. ${check.error_message || ''}`;
      case 'slow':
        return `Response time (${Math.round(check.response_time_ms)}ms) exceeded acceptable threshold.`;
      case 'error':
        return `Error occurred: ${check.error_message || 'Unknown error'}`;
      default:
        return alert.message;
    }
  };

  if (loading) {
    return (
      <div className={applyTheme.page()}>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-palette-primary" />
          <p className="ml-4 text-slate-600">Loading endpoint details...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={applyTheme.page()}>
        <Card className={applyTheme.card()}>
          <CardHeader>
            <CardTitle className={applyTheme.text('primary')}>Endpoint Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/workspace/api-monitoring')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to API Monitoring
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { endpoint, checks, alerts, statistics } = data;

  return (
    <div className={applyTheme.page()}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push('/workspace/api-monitoring')}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className={`text-h2-dynamic font-bold ${applyTheme.text('primary')}`}>
              {endpoint.name}
            </h1>
            <p className={`text-sm ${applyTheme.text('secondary')} mt-1`}>
              {endpoint.method} {endpoint.url}
            </p>
          </div>
        </div>
        <Button onClick={testEndpoint} disabled={testing} className={applyTheme.button("primary")}>
          {testing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Test Now
            </>
          )}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className={applyTheme.card()}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h2-dynamic font-bold">{statistics.success_rate.toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-1">
              {statistics.successful_checks} / {statistics.total_checks} checks
            </p>
          </CardContent>
        </Card>
        <Card className={applyTheme.card()}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h2-dynamic font-bold">{Math.round(statistics.avg_response_time_ms)}ms</div>
            <p className="text-xs text-slate-500 mt-1">Average across all checks</p>
          </CardContent>
        </Card>
        <Card className={applyTheme.card()}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">24h Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h2-dynamic font-bold">{statistics.checks_24h.success_rate.toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-1">
              {statistics.checks_24h.successful} / {statistics.checks_24h.total} checks
            </p>
          </CardContent>
        </Card>
        <Card className={applyTheme.card()}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h2-dynamic font-bold text-red-600">{statistics.active_alerts}</div>
            <p className="text-xs text-slate-500 mt-1">Unresolved issues</p>
          </CardContent>
        </Card>
      </div>

      {/* Endpoint Configuration */}
      <Card className={applyTheme.card() + " mb-6"}>
        <CardHeader>
          <CardTitle className={applyTheme.text('primary')}>Endpoint Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-500">Method</p>
              <Badge variant="outline" className="mt-1">{endpoint.method}</Badge>
            </div>
            <div>
              <p className="text-sm text-slate-500">Expected Status</p>
              <p className="font-semibold mt-1">{endpoint.expected_status_code}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Timeout</p>
              <p className="font-semibold mt-1">{endpoint.timeout_seconds}s</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Check Interval</p>
              <p className="font-semibold mt-1">Every {endpoint.check_interval_minutes} min</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Status</p>
              <Badge
                className={endpoint.is_active ? "bg-green-500 mt-1" : "bg-gray-500 mt-1"}
              >
                {endpoint.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-slate-500">Created</p>
              <p className="text-sm mt-1">{new Date(endpoint.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="checks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="checks">
            Check History ({checks.length})
          </TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts ({alerts.length})
            {statistics.active_alerts > 0 && (
              <Badge variant="destructive" className="ml-2">
                {statistics.active_alerts}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Check History Tab */}
        <TabsContent value="checks" className="space-y-4">
          <Card className={applyTheme.card()}>
            <CardHeader>
              <CardTitle className={applyTheme.text('primary')}>Check History</CardTitle>
              <CardDescription className={applyTheme.text('secondary')}>
                Recent monitoring checks for this endpoint
              </CardDescription>
            </CardHeader>
            <CardContent>
              {checks.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className={applyTheme.text('secondary')}>No checks performed yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Status Code</TableHead>
                      <TableHead>Response Time</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checks.map((check) => (
                      <TableRow key={check.id}>
                        <TableCell className="text-sm">
                          {new Date(check.checked_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={check.status_code === endpoint.expected_status_code ? "default" : "destructive"}>
                            {check.status_code || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>{Math.round(check.response_time_ms)}ms</TableCell>
                        <TableCell>
                          {check.is_success ? (
                            <Badge className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Success
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-red-600 max-w-md truncate">
                          {check.error_message || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card className={applyTheme.card()}>
            <CardHeader>
              <CardTitle className={applyTheme.text('primary')}>Alerts</CardTitle>
              <CardDescription className={applyTheme.text('secondary')}>
                Issues and failures detected for this endpoint
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className={applyTheme.text('secondary')}>No alerts for this endpoint.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <Card
                      key={alert.id}
                      className={`border-l-4 ${
                        alert.is_resolved
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                      }`}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle
                              className={`h-5 w-5 ${
                                alert.is_resolved ? 'text-green-600' : 'text-red-600'
                              }`}
                            />
                            <CardTitle className="text-h4-dynamic">
                              <Badge variant={alert.is_resolved ? "default" : "destructive"}>
                                {alert.alert_type.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </CardTitle>
                            {alert.is_resolved && (
                              <Badge className="bg-green-500">Resolved</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="font-semibold text-sm mb-1">Why this alert occurred:</p>
                            <p className="text-sm bg-white p-3 rounded border">
                              {getAlertReason(alert)}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-slate-500">Status Code:</p>
                              <p className="font-semibold">
                                {alert.api_check.status_code || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500">Response Time:</p>
                              <p className="font-semibold">
                                {Math.round(alert.api_check.response_time_ms)}ms
                              </p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-slate-500">Error Message:</p>
                              <p className="font-semibold text-red-600">
                                {alert.api_check.error_message || "No error message"}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-slate-500 text-sm">Original Alert Message:</p>
                            <p className="text-sm mt-1">{alert.message}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

