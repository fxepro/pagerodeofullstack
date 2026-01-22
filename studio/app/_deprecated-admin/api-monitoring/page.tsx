"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import axios from "axios";
import { getApiBaseUrl } from "@/lib/api-config";
import {
  Network,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Plus,
  Search,
  Play,
  Eye,
} from "lucide-react";

interface APIEndpoint {
  id: number;
  name: string;
  url: string;
  method: string;
  expected_status_code: number;
  is_active: boolean;
  context?: string; // Auto-detected context/app/function
  last_check_status: {
    status_code: number;
    response_time_ms: number;
    is_success: boolean;
    checked_at: string;
  } | null;
}

interface APICheck {
  id: number;
  endpoint: number;
  endpoint_name: string;
  endpoint_url: string;
  status_code: number | null;
  response_time_ms: number;
  is_success: boolean;
  error_message: string | null;
  checked_at: string;
}

interface APIAlert {
  id: number;
  endpoint: number;
  endpoint_name: string;
  endpoint_url: string;
  alert_type: string;
  message: string;
  is_resolved: boolean;
  created_at: string;
}

interface Stats {
  total_endpoints: number;
  active_endpoints: number;
  recent_checks_24h: {
    total: number;
    successful: number;
    failed: number;
    success_rate: number;
  };
  active_alerts: number;
}

export default function AdminAPIMonitoringPage() {
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [checks, setChecks] = useState<APICheck[]>([]);
  const [alerts, setAlerts] = useState<APIAlert[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<number[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  // Default to current origin in production, localhost in dev
  const [discoverUrl, setDiscoverUrl] = useState(
    typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:8000'
  );

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    method: "GET",
    expected_status_code: 200,
    timeout_seconds: 10,
    check_interval_minutes: 5,
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        // No token - redirect to login
        window.location.href = "/login";
        return;
      }

      const apiBase = getApiBaseUrl();
      const [statsRes, endpointsRes, checksRes, alertsRes] = await Promise.all([
        axios.get(`${apiBase}/api/admin-tools/stats/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${apiBase}/api/admin-tools/endpoints/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${apiBase}/api/admin-tools/checks/?limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${apiBase}/api/admin-tools/alerts/?is_resolved=false&limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setStats(statsRes.data);
      setEndpoints(endpointsRes.data);
      setChecks(checksRes.data);
      setAlerts(alertsRes.data);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      
      // Handle 401 Unauthorized - token expired or invalid
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return;
      }
      
      // Handle 403 Forbidden - not admin
      if (error.response?.status === 403) {
        console.error("Admin access required");
        // Could redirect to dashboard or show error message
      }
    } finally {
      setLoading(false);
    }
  };

  const testEndpoint = async (endpointId: number) => {
    setTesting((prev) => [...prev, endpointId]);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }
      const apiBase = getApiBaseUrl();
      await axios.post(
        `${apiBase}/api/admin-tools/endpoints/${endpointId}/test/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchData();
    } catch (error: any) {
      console.error("Error testing endpoint:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return;
      }
    } finally {
      setTesting((prev) => prev.filter((id) => id !== endpointId));
    }
  };

  const testMultiple = async () => {
    const selected = endpoints.filter((e) => e.is_active).map((e) => e.id);
    if (selected.length === 0) return;

    setTesting(selected);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }
      const apiBase = getApiBaseUrl();
      await axios.post(
        `${apiBase}/api/admin-tools/endpoints/test-multiple/`,
        { endpoint_ids: selected },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchData();
    } catch (error: any) {
      console.error("Error testing endpoints:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return;
      }
    } finally {
      setTesting([]);
    }
  };

  const discoverAPIs = async () => {
    setDiscovering(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }
      const apiBase = getApiBaseUrl();
      const response = await axios.post(
        `${apiBase}/api/admin-tools/endpoints/discover/`,
        { base_url: discoverUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Show success feedback
      if (response.data.created > 0) {
        console.log(`✅ Discovered ${response.data.discovered} APIs, created ${response.data.created} new endpoints`);
        alert(`Success! Discovered ${response.data.discovered} APIs and created ${response.data.created} new endpoints.`);
      } else if (response.data.discovered > 0) {
        console.log(`Found ${response.data.discovered} APIs (all already exist)`);
        alert(`Found ${response.data.discovered} APIs, but they already exist in the system.`);
      } else {
        alert('No APIs discovered. Check the base URL and ensure the server is accessible.');
      }
      
      await fetchData();
    } catch (error: any) {
      console.error("Error discovering APIs:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return;
      }
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Discovery failed: ${errorMsg}`);
    } finally {
      setDiscovering(false);
    }
  };

  // Extract path from URL for name
  const extractPathFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.replace(/^\/|\/$/g, ''); // Remove leading/trailing slashes
    } catch {
      // If URL parsing fails, try to extract path manually
      const match = url.match(/\/\/[^\/]+(\/.+)/);
      return match ? match[1].replace(/^\/|\/$/g, '') : url;
    }
  };

  const createEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }
      const apiBase = getApiBaseUrl();
      
      // Auto-extract path from URL for name if name is empty
      const endpointData = {
        ...formData,
        name: formData.name || extractPathFromUrl(formData.url),
      };
      
      await axios.post(
        `${apiBase}/api/admin-tools/endpoints/`,
        endpointData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowAddForm(false);
      setFormData({
        name: "",
        url: "",
        method: "GET",
        expected_status_code: 200,
        timeout_seconds: 10,
        check_interval_minutes: 5,
        is_active: true,
      });
      await fetchData();
    } catch (error: any) {
      console.error("Error creating endpoint:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return;
      }
    }
  };

  const resolveAlert = async (id: number) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }
      const apiBase = getApiBaseUrl();
      await axios.post(
        `${apiBase}/api/admin-tools/alerts/${id}/resolve/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchData();
    } catch (error: any) {
      console.error("Error resolving alert:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return;
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading API monitoring...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={applyTheme.page()}>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_endpoints}</div>
              <p className="text-xs text-slate-500 mt-1">{stats.active_endpoints} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Success Rate (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recent_checks_24h.success_rate.toFixed(1)}%</div>
              <p className="text-xs text-slate-500 mt-1">
                {stats.recent_checks_24h.successful} / {stats.recent_checks_24h.total}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Failed Checks (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.recent_checks_24h.failed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.active_alerts}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Discover APIs */}
      <Card>
        <CardHeader>
          <CardTitle>Discover APIs</CardTitle>
          <CardDescription>Automatically discover API endpoints from a base URL</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={discoverUrl}
              onChange={(e) => setDiscoverUrl(e.target.value)}
              placeholder={typeof window !== 'undefined' ? window.location.origin : "http://localhost:8000"}
              className="flex-1"
            />
            <Button onClick={discoverAPIs} disabled={discovering}>
              <Search className="h-4 w-4 mr-2" />
              {discovering ? "Discovering..." : "Discover"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Endpoint Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Endpoint</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createEndpoint} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>URL</Label>
                  <Input
                    value={formData.url}
                    onChange={(e) => {
                      const url = e.target.value;
                      // Auto-extract path for name when URL changes
                      const path = extractPathFromUrl(url);
                      setFormData({ ...formData, url, name: path || formData.name });
                    }}
                    required
                    placeholder="https://example.com/api/endpoint"
                  />
                </div>
                <div>
                  <Label>Name (auto-filled from URL path)</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Will be extracted from URL"
                  />
                </div>
                <div>
                  <Label>Method</Label>
                  <select
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>DELETE</option>
                    <option>PATCH</option>
                  </select>
                </div>
                <div>
                  <Label>Expected Status Code</Label>
                  <Input
                    type="number"
                    value={formData.expected_status_code}
                    onChange={(e) => setFormData({ ...formData, expected_status_code: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Endpoint</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons - Above Tabs */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button onClick={testMultiple} disabled={testing.length > 0 || endpoints.filter(e => e.is_active).length === 0}>
          <Play className="h-4 w-4 mr-2" />
          Test All Active
        </Button>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Endpoint
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="endpoints" className="space-y-4">
        <TabsList>
          <TabsTrigger value="endpoints">Endpoints ({endpoints.length})</TabsTrigger>
          <TabsTrigger value="checks">Recent Checks ({checks.length})</TabsTrigger>
          <TabsTrigger value="alerts">
            Active Alerts ({alerts.length})
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Context/App/Function</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Check</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {endpoints.map((endpoint) => (
                    <TableRow key={endpoint.id}>
                      <TableCell className="font-medium text-sm">{endpoint.url}</TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {endpoint.context || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{endpoint.method}</Badge>
                      </TableCell>
                      <TableCell>
                        {endpoint.last_check_status ? (
                          endpoint.last_check_status.is_success ? (
                            <Badge className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {endpoint.last_check_status.status_code} ({Math.round(endpoint.last_check_status.response_time_ms)}ms)
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              {endpoint.last_check_status.status_code || "Error"}
                            </Badge>
                          )
                        ) : (
                          <Badge variant="outline">Not checked</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {endpoint.last_check_status
                          ? new Date(endpoint.last_check_status.checked_at).toLocaleString()
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testEndpoint(endpoint.id)}
                          disabled={testing.includes(endpoint.id)}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Checked At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checks.map((check) => (
                    <TableRow key={check.id}>
                      <TableCell className="font-medium">{check.endpoint_name}</TableCell>
                      <TableCell>
                        {check.is_success ? (
                          <Badge className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {check.status_code}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            {check.status_code || "Error"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{Math.round(check.response_time_ms)}ms</TableCell>
                      <TableCell>{new Date(check.checked_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No active alerts</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-medium">{alert.endpoint_name}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{alert.alert_type}</Badge>
                        </TableCell>
                        <TableCell>{alert.message}</TableCell>
                        <TableCell>{new Date(alert.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

