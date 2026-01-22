"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Shield,
  AlertTriangle,
  Activity,
  Plus,
  RefreshCw,
  Download,
  Eye,
  Edit,
  Search,
  Square,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import axios from "axios";
import { getApiBaseUrl } from "@/lib/api-config";

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

// Helper function to make authenticated request
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
    } else if (method === 'PATCH') {
      response = await axios.patch(url, data, config);
    } else if (method === 'DELETE') {
      response = await axios.delete(url, config);
    } else {
      throw new Error(`Unsupported method: ${method}`);
    }
    return response;
  } catch (err: any) {
    if (err.response?.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
        if (method === 'GET') {
          return await axios.get(url, config);
        } else if (method === 'POST') {
          return await axios.post(url, data, config);
        } else if (method === 'PUT') {
          return await axios.put(url, data, config);
        } else if (method === 'PATCH') {
          return await axios.patch(url, data, config);
        } else if (method === 'DELETE') {
          return await axios.delete(url, config);
        }
      }
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
      throw err;
    }
    throw err;
  }
};

interface SecurityScan {
  id: number;
  scan_type: string;
  target_url: string;
  status: string;
  tool_used: string;
  started_at: string | null;
  completed_at: string | null;
  findings_count: number;
  created_at: string;
  created_by_name: string | null;
}

interface SecurityFinding {
  id: number;
  title: string;
  severity: string;
  status: string;
  affected_url: string;
  cvss_score: number | null;
  scan_type: string;
  scan_target: string;
  created_at: string;
}

interface Stats {
  total_scans: number;
  active_scans: number;
  critical_findings: number;
  high_findings: number;
  recent_scans: SecurityScan[];
}

const SCAN_TYPES = [
  { value: 'dns_discovery', label: 'DNS/Subdomain Discovery' },
  { value: 'port_scan', label: 'Port & Service Discovery' },
  { value: 'vulnerability_scan', label: 'External Network / Host Vulnerability Scan' },
  { value: 'dast', label: 'DAST (Automated Web App Scanning)' },
  { value: 'misconfiguration_scan', label: 'Web-server Misconfiguration Scan' },
  { value: 'ssl_check', label: 'TLS / SSL Configuration & Cert Checks' },
  { value: 'cms_scan', label: 'CMS / Platform-specific Remote Scans' },
  { value: 'sql_injection', label: 'SQL Injection / Targeted Exploit Checks' },
  { value: 'headers_check', label: 'HTTP Security Headers & Basic Hardening Checks' },
  { value: 'continuous_monitoring', label: 'Automated External Monitoring / Continuous Scanning' },
  { value: 'manual_pentest', label: 'Manual Pentest Tools (Proxy & Manual Testing)' },
];

const TOOL_MAP: Record<string, string[]> = {
  'dns_discovery': ['amass'],
  'port_scan': ['Nmap'],
  'vulnerability_scan': ['Nessus', 'OpenVAS/Greenbone'],
  'dast': ['OWASP ZAP', 'Burp Suite'],
  'misconfiguration_scan': ['Nikto'],
  'ssl_check': ['Qualys SSL Labs', 'sslscan', 'testssl.sh'],
  'cms_scan': ['WPScan'],
  'sql_injection': ['sqlmap'],
  'headers_check': ['securityheaders.io', 'Mozilla Observatory'],
  'continuous_monitoring': ['Detectify', 'Intruder', 'Qualys SaaS'],
  'manual_pentest': ['Burp Suite', 'OWASP ZAP'],
};

export default function SecurityMonitoringPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [scans, setScans] = useState<SecurityScan[]>([]);
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterFindingStatus, setFilterFindingStatus] = useState("all");
  const [filterScanType, setFilterScanType] = useState("all");
  const [tools, setTools] = useState<any[]>([]);
  const [loadingTools, setLoadingTools] = useState(false);
  const [toolCategoryTab, setToolCategoryTab] = useState("site_audit");
  const [toolApiKeys, setToolApiKeys] = useState<Record<number, string>>({});
  
  const [scanForm, setScanForm] = useState({
    scan_type: 'dast',
    target_url: '',
    tool_used: '',
    scan_config: {
      include_subdomains: false,
      deep_scan: false,
    },
    scheduled_at: null as string | null,
  });

  useEffect(() => {
    loadData();
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      setLoadingTools(true);
      const apiBase = getApiBaseUrl();
      const response = await makeAuthenticatedRequest(`${apiBase}/api/security/tools/`);
      setTools(response.data);
      // Initialize API keys from loaded tools
      const keys: Record<number, string> = {};
      response.data.forEach((tool: any) => {
        if (tool.api_key) {
          keys[tool.id] = tool.api_key;
        }
      });
      setToolApiKeys(keys);
    } catch (error: any) {
      console.error("Error loading tools:", error);
    } finally {
      setLoadingTools(false);
    }
  };

  const handleApiKeySave = async (toolId: number, apiKey: string) => {
    try {
      const apiBase = getApiBaseUrl();
      await makeAuthenticatedRequest(
        `${apiBase}/api/security/tools/${toolId}/`,
        'PATCH',
        { api_key: apiKey }
      );
      await loadTools();
    } catch (error: any) {
      console.error("Error saving API key:", error);
      alert('Failed to save API key: ' + (error.response?.data?.error || error.message));
    }
  };

  const renderToolCard = (tool: any) => {
    const actualStatus = tool.actual_status || {};
    const isInstalled = actualStatus.installed !== false;
    const statusColor = actualStatus.status === 'configured' || actualStatus.status === 'available' 
      ? 'bg-green-600' 
      : actualStatus.status === 'error' 
      ? 'bg-red-600' 
      : 'bg-yellow-600';
    
    return (
      <Card key={tool.id} className={isInstalled ? 'border-green-500' : 'border-yellow-500'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 flex-wrap">
                {tool.name}
                <Badge variant={isInstalled ? 'default' : 'outline'} className={statusColor}>
                  {actualStatus.status || tool.status}
                </Badge>
                {actualStatus.version && (
                  <Badge variant="outline" className="text-xs">
                    {actualStatus.version}
                  </Badge>
                )}
                {tool.is_active && (
                  <Badge variant="default" className="bg-green-600">Active</Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-2">{tool.description}</CardDescription>
              {actualStatus.message && (
                <p className={`text-sm mt-1 ${isInstalled ? 'text-green-700' : 'text-yellow-700'}`}>
                  {actualStatus.message}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const apiBase = getApiBaseUrl();
                    const response = await makeAuthenticatedRequest(
                      `${apiBase}/api/security/tools/${tool.id}/`,
                      'POST',
                      { action: 'test' }
                    );
                    await loadTools();
                    alert(response.data.test_result?.message || 'Test completed');
                  } catch (error: any) {
                    console.error("Error testing tool:", error);
                    alert('Failed to test tool: ' + (error.response?.data?.error || error.message));
                  }
                }}
              >
                <Activity className="h-4 w-4 mr-2" />
                Test
              </Button>
              {tool.documentation_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(tool.documentation_url, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Docs
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Tool Type</Label>
              <p className="text-sm text-muted-foreground">{tool.tool_type}</p>
            </div>
            
            {/* API Key Input for API tools */}
            {tool.tool_type === 'api' && (
              <div>
                <Label className="text-sm font-medium">API Key</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="password"
                    placeholder={tool.api_key ? '••••••••' : 'Enter API key'}
                    value={toolApiKeys[tool.id] !== undefined ? toolApiKeys[tool.id] : (tool.api_key || '')}
                    onChange={(e) => setToolApiKeys(prev => ({ ...prev, [tool.id]: e.target.value }))}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleApiKeySave(tool.id, toolApiKeys[tool.id] || tool.api_key || '')}
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}
            
            {tool.installation_instructions && (
              <div>
                <Label className="text-sm font-medium">Installation</Label>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{tool.installation_instructions}</p>
              </div>
            )}
            {(actualStatus.path || tool.executable_path) && (
              <div>
                <Label className="text-sm font-medium">Executable Path</Label>
                <p className="text-sm text-muted-foreground font-mono">{actualStatus.path || tool.executable_path}</p>
              </div>
            )}
            {tool.supported_scan_types && tool.supported_scan_types.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Supported Scan Types</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {tool.supported_scan_types.map((scanType: string) => (
                    <Badge key={scanType} variant="outline">
                      {SCAN_TYPES.find(t => t.value === scanType)?.label || scanType}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {tool.last_tested && (
              <div>
                <Label className="text-sm font-medium">Last Tested</Label>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(tool.last_tested), 'MMM d, yyyy HH:mm')}
                </p>
                {tool.test_result && (
                  <p className="text-xs text-muted-foreground mt-1">{tool.test_result}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const apiBase = getApiBaseUrl();
      const token = localStorage.getItem("access_token");
      
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const [statsRes, scansRes, findingsRes] = await Promise.all([
        makeAuthenticatedRequest(`${apiBase}/api/security/stats/`),
        makeAuthenticatedRequest(`${apiBase}/api/security/scans/`),
        makeAuthenticatedRequest(`${apiBase}/api/security/findings/`),
      ]);

      setStats(statsRes.data || {});
      setScans(scansRes.data || []);
      setFindings(findingsRes.data || []);
      
      // Debug logging
      console.log("Loaded scans:", scansRes.data);
      console.log("Scans count:", scansRes.data?.length || 0);
    } catch (error: any) {
      console.error("Error loading security data:", error);
      console.error("Error details:", error.response?.data);
      if (error.response?.status === 401) {
        window.location.href = "/login";
      } else {
        // Set empty arrays on error to prevent crashes
        setScans([]);
        setFindings([]);
        setStats(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Build scan_config based on scan type
      let scan_config: any = {
        include_subdomains: scanForm.scan_config.include_subdomains,
        deep_scan: scanForm.scan_config.deep_scan,
      };
      
      // For ZAP (DAST), map deep_scan to scan_type (baseline or full)
      if (scanForm.scan_type === 'dast') {
        scan_config.scan_type = scanForm.scan_config.deep_scan ? 'full' : 'baseline';
        // Optionally include ZAP path if configured
        const zapPath = localStorage.getItem('zap_path');
        if (zapPath) {
          scan_config.zap_path = zapPath;
        }
      }
      
      // Ensure tool_used is set
      const formData = {
        ...scanForm,
        tool_used: scanForm.tool_used || TOOL_MAP[scanForm.scan_type]?.[0] || 'Manual',
        scan_config: scan_config,
      };
      
      const apiBase = getApiBaseUrl();
      const response = await makeAuthenticatedRequest(
        `${apiBase}/api/security/scans/`,
        'POST',
        formData
      );
      setIsCreateDialogOpen(false);
      setScanForm({
        scan_type: 'dast',
        target_url: '',
        tool_used: '',
        scan_config: {
          include_subdomains: false,
          deep_scan: false,
        },
        scheduled_at: null,
      });
      await loadData();
    } catch (error: any) {
      console.error("Error creating scan:", error);
      const errorMessage = error.response?.data?.error || 
                           error.response?.data?.detail || 
                           error.response?.data?.message ||
                           error.message || 
                           'Unknown error';
      const errorDetail = error.response?.data?.detail || error.response?.data?.traceback;
      console.error("Full error response:", error.response?.data);
      alert(`Failed to create scan: ${errorMessage}${errorDetail ? '\n\nDetails: ' + errorDetail : ''}`);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const filteredScans = scans.filter((scan) => {
    if (filterType !== 'all' && scan.scan_type !== filterType) return false;
    if (filterStatus !== 'all' && scan.status !== filterStatus) return false;
    if (searchQuery && !scan.target_url.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !scan.tool_used.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredFindings = findings.filter((finding) => {
    if (filterSeverity !== 'all' && finding.severity !== filterSeverity) return false;
    if (filterFindingStatus !== 'all' && finding.status !== filterFindingStatus) return false;
    if (filterScanType !== 'all' && finding.scan_type !== filterScanType) return false;
    if (searchQuery) {
      const titleMatch = finding.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = (finding as any).description?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!titleMatch && !descMatch) return false;
    }
    return true;
  });

  const handleScanTypeChange = (value: string) => {
    setScanForm({
      ...scanForm,
      scan_type: value,
      tool_used: TOOL_MAP[value]?.[0] || '',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-h4-dynamic font-bold">Security Monitoring</h1>
          <p className="text-muted-foreground mt-1">
            Monitor security threats, vulnerabilities, and security events through automated external testing
          </p>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-palette-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading security data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-h4-dynamic font-bold">Security Monitoring</h1>
        <p className="text-muted-foreground mt-1">
          Monitor security threats, vulnerabilities, and security events through automated external testing
        </p>
      </div>

      {/* Stats Cards - Moved to Top */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h1-dynamic font-bold">{stats?.total_scans || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Critical Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h1-dynamic font-bold text-red-600">
              {stats?.critical_findings || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Requires immediate action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              High Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h1-dynamic font-bold text-orange-600">
              {stats?.high_findings || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              Active Scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h1-dynamic font-bold text-blue-600">
              {stats?.active_scans || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">In progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Scan
          </Button>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="scans">Scans ({scans.length})</TabsTrigger>
          <TabsTrigger value="findings">
            Findings ({findings.length})
            {stats && (stats.critical_findings > 0 || stats.high_findings > 0) && (
              <Badge variant="destructive" className="ml-2">
                {stats.critical_findings + stats.high_findings}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Scans */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Scans</CardTitle>
                <CardDescription>Latest security scan activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recent_scans && stats.recent_scans.length > 0 ? (
                    stats.recent_scans.map((scan) => (
                      <div key={scan.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{SCAN_TYPES.find(t => t.value === scan.scan_type)?.label || scan.scan_type}</div>
                          <div className="text-sm text-muted-foreground">
                            {scan.target_url}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={getStatusVariant(scan.status)}>
                            {scan.status}
                          </Badge>
                          {scan.completed_at && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(scan.completed_at), { addSuffix: true })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent scans</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Critical Findings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Critical Findings Requiring Attention
                </CardTitle>
                <CardDescription>Findings that need immediate action</CardDescription>
              </CardHeader>
              <CardContent>
                {findings.filter(f => f.severity === 'critical' && ['new', 'confirmed'].includes(f.status)).length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {findings
                        .filter(f => f.severity === 'critical' && ['new', 'confirmed'].includes(f.status))
                        .slice(0, 5)
                        .map((finding) => (
                          <TableRow key={finding.id}>
                            <TableCell className="font-medium">{finding.title}</TableCell>
                            <TableCell className="max-w-[150px] truncate">{finding.affected_url || finding.scan_target}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{finding.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No critical findings</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Scans Tab */}
        <TabsContent value="scans" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search scans..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {SCAN_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Scans Table */}
          <Card>
            <CardHeader>
              <CardTitle>Security Scans ({filteredScans.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredScans.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                  <Shield className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                  <p className="text-h4-dynamic font-medium text-slate-700 mb-2">No scans found</p>
                  <p className="text-sm">Create a new scan to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Target URL</TableHead>
                      <TableHead>Scan Type</TableHead>
                      <TableHead>Tool</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Findings</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredScans.map((scan) => (
                      <TableRow key={scan.id}>
                        <TableCell className="font-medium">{scan.target_url}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {SCAN_TYPES.find(t => t.value === scan.scan_type)?.label || scan.scan_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{scan.tool_used}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(scan.status)}>
                            {scan.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {scan.started_at ? format(new Date(scan.started_at), 'MMM d, HH:mm') : '—'}
                        </TableCell>
                        <TableCell>
                          {scan.completed_at ? format(new Date(scan.completed_at), 'MMM d, HH:mm') : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={scan.findings_count > 0 ? 'default' : 'outline'}>
                            {scan.findings_count} findings
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/workspace/security-monitoring/${scan.id}`)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {scan.status === 'pending' ? (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    setLoading(true);
                                    const apiBase = getApiBaseUrl();
                                    await makeAuthenticatedRequest(
                                      `${apiBase}/api/security/scans/${scan.id}/run/`,
                                      'POST'
                                    );
                                    await loadData();
                                  } catch (error: any) {
                                    console.error("Error running scan:", error);
                                    alert('Failed to run scan: ' + (error.response?.data?.error || error.message));
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                title="Run Scan"
                              >
                                <Activity className="h-4 w-4 mr-1" />
                                Run
                              </Button>
                            ) : scan.status === 'running' ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled
                                title="Scan is running"
                              >
                                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                Running
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    setLoading(true);
                                    const apiBase = getApiBaseUrl();
                                    await makeAuthenticatedRequest(
                                      `${apiBase}/api/security/scans/${scan.id}/run/`,
                                      'POST'
                                    );
                                    await loadData();
                                  } catch (error: any) {
                                    console.error("Error running scan:", error);
                                    alert('Failed to run scan: ' + (error.response?.data?.error || error.message));
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                title="Re-run Scan"
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Re-run
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Findings Tab */}
        <TabsContent value="findings" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 flex-wrap">
                <Input
                  placeholder="Search findings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="informational">Informational</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterFindingStatus} onValueChange={setFilterFindingStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="false_positive">False Positive</SelectItem>
                    <SelectItem value="mitigated">Mitigated</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterScanType} onValueChange={setFilterScanType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {SCAN_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Findings Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Security Findings ({filteredFindings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredFindings.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                  <p className="text-h4-dynamic font-medium text-slate-700 mb-2">No findings found</p>
                  <p className="text-sm">No security findings match your filters</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Scan Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>CVSS</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFindings.map((finding) => (
                      <TableRow key={finding.id}>
                        <TableCell className="font-medium">{finding.title}</TableCell>
                        <TableCell>
                          <Badge variant={getSeverityVariant(finding.severity)}>
                            {finding.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {finding.affected_url || finding.scan_target}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {SCAN_TYPES.find(t => t.value === finding.scan_type)?.label || finding.scan_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{finding.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {finding.cvss_score ? (
                            <span className="font-mono">{finding.cvss_score}</span>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {/* TODO: Edit finding */}}
                            >
                              <Edit className="h-4 w-4" />
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
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Scans</CardTitle>
              <CardDescription>Manage automated security scans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-600">
                <Clock className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                <p className="text-h4-dynamic font-medium text-slate-700 mb-2">Scheduled scans coming soon</p>
                <p className="text-sm">Schedule automated scans to run on a regular basis</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Tools Management</CardTitle>
              <CardDescription>Configure and manage security scanning tools. Status is automatically detected.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTools ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-palette-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-4">Loading tools...</p>
                </div>
              ) : tools.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                  <Shield className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                  <p className="text-h4-dynamic font-medium text-slate-700 mb-2">No tools configured</p>
                  <p className="text-sm">Run setup_security_tools management command to seed tools</p>
                </div>
              ) : (
                <Tabs value={toolCategoryTab} onValueChange={setToolCategoryTab} className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="site_audit">Site Audit</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="api">API</TabsTrigger>
                  </TabsList>

                  {/* Site Audit Tools */}
                  <TabsContent value="site_audit" className="space-y-4">
                    {tools.filter(t => t.category === 'site_audit').map((tool) => renderToolCard(tool))}
                    {tools.filter(t => t.category === 'site_audit').length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No Site Audit tools configured
                      </div>
                    )}
                  </TabsContent>

                  {/* Security Tools */}
                  <TabsContent value="security" className="space-y-4">
                    {tools.filter(t => t.category === 'security').map((tool) => renderToolCard(tool))}
                    {tools.filter(t => t.category === 'security').length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No Security tools configured
                      </div>
                    )}
                  </TabsContent>

                  {/* API Tools */}
                  <TabsContent value="api" className="space-y-4">
                    {tools.filter(t => t.category === 'api').map((tool) => renderToolCard(tool))}
                    {tools.filter(t => t.category === 'api').length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No API tools configured
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Scan Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Security Scan</DialogTitle>
            <DialogDescription>
              Configure and start a new security scan
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateScan} className="space-y-4">
            <div>
              <Label>Scan Type</Label>
              <Select value={scanForm.scan_type} onValueChange={handleScanTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCAN_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Target URL</Label>
              <Input
                type="url"
                value={scanForm.target_url}
                onChange={(e) => setScanForm({...scanForm, target_url: e.target.value})}
                placeholder="https://example.com"
                required
              />
            </div>

            <div>
              <Label>Tool</Label>
              <Select 
                value={scanForm.tool_used} 
                onValueChange={(v) => setScanForm({...scanForm, tool_used: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a tool" />
                </SelectTrigger>
                <SelectContent>
                  {TOOL_MAP[scanForm.scan_type]?.map(tool => (
                    <SelectItem key={tool} value={tool}>{tool}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Configuration</Label>
              <div className="space-y-2 mt-2">
                {scanForm.scan_type === 'dns_discovery' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include_subdomains"
                      checked={scanForm.scan_config.include_subdomains}
                      onCheckedChange={(checked) => setScanForm({
                        ...scanForm,
                        scan_config: {...scanForm.scan_config, include_subdomains: checked as boolean}
                      })}
                    />
                    <Label htmlFor="include_subdomains" className="font-normal">Include subdomains</Label>
                  </div>
                )}
                {scanForm.scan_type === 'dast' && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="deep_scan"
                        checked={scanForm.scan_config.deep_scan}
                        onCheckedChange={(checked) => setScanForm({
                          ...scanForm,
                          scan_config: {...scanForm.scan_config, deep_scan: checked as boolean}
                        })}
                      />
                      <Label htmlFor="deep_scan" className="font-normal">
                        Full scan (baseline scan if unchecked)
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      Baseline: Quick passive scan. Full: Comprehensive active scan (takes longer).
                    </p>
                  </div>
                )}
                {scanForm.scan_type !== 'dast' && scanForm.scan_type !== 'dns_discovery' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="deep_scan"
                      checked={scanForm.scan_config.deep_scan}
                      onCheckedChange={(checked) => setScanForm({
                        ...scanForm,
                        scan_config: {...scanForm.scan_config, deep_scan: checked as boolean}
                      })}
                    />
                    <Label htmlFor="deep_scan" className="font-normal">Deep scan</Label>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Create Scan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
