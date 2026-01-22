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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Settings,
  CheckCircle2,
  XCircle,
  Edit,
  Key,
  Code,
  Globe,
  Zap,
  Shield,
  Server,
  FileText,
  Link2,
  Type,
  Activity,
  Brain,
  BarChart3,
  Eye,
} from "lucide-react";
import { getApiBaseUrl } from "@/lib/api-config";
import { toast } from "sonner";

interface SecurityTool {
  id: number;
  name: string;
  tool_type: 'builtin' | 'external' | 'api';
  category: 'site_audit' | 'security' | 'api' | 'performance';
  status: string;
  description: string;
  installation_instructions?: string;
  executable_path?: string;
  api_key?: string;
  api_url?: string;
  supported_scan_types?: string[];
  documentation_url?: string;
  is_active: boolean;
  last_tested?: string;
  test_result?: string;
  actual_status?: {
    installed: boolean;
    status: string;
    message?: string;
    version?: string;
    path?: string;
  };
}

interface PlatformTool {
  id: string;
  name: string;
  service: string;
  type: "api" | "custom";
  category: 'site_audit' | 'security' | 'api' | 'performance';
  apiKeyName: string;
  status: "configured" | "not_configured" | "error";
  description: string;
  endpoint?: string;
}

type UnifiedTool = (SecurityTool & { source: 'security' }) | (PlatformTool & { source: 'platform' });

const PLATFORM_TOOLS: PlatformTool[] = [
  {
    id: "performance",
    name: "Performance Analysis",
    service: "Google PageSpeed Insights API",
    type: "api",
    category: "site_audit",
    apiKeyName: "PAGESPEED_API_KEY",
    status: "not_configured",
    description: "Website speed and optimization analysis",
    endpoint: "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
  },
  {
    id: "ssl",
    name: "SSL Certificate Check",
    service: "Custom Code (Node.js TLS/DNS)",
    type: "custom",
    category: "site_audit",
    apiKeyName: "",
    status: "configured",
    description: "SSL certificate validation and expiration checking",
  },
  {
    id: "dns",
    name: "DNS Analysis",
    service: "Custom Code (Node.js DNS)",
    type: "custom",
    category: "site_audit",
    apiKeyName: "",
    status: "configured",
    description: "DNS record lookup and configuration analysis",
  },
  {
    id: "typography",
    name: "Typography Analysis",
    service: "Puppeteer (Custom Code)",
    type: "custom",
    category: "site_audit",
    apiKeyName: "",
    status: "configured",
    description: "Font analysis and typography recommendations",
  },
  {
    id: "links",
    name: "Link Validation",
    service: "Custom Code (Fetch/HTML Parsing)",
    type: "custom",
    category: "site_audit",
    apiKeyName: "",
    status: "configured",
    description: "Broken link detection and validation",
  },
  {
    id: "sitemap",
    name: "Sitemap Analysis",
    service: "Custom Code (Fetch/XML Parsing)",
    type: "custom",
    category: "site_audit",
    apiKeyName: "",
    status: "configured",
    description: "Sitemap structure and validation",
  },
  {
    id: "monitor",
    name: "Website Monitoring",
    service: "Custom Code (Fetch)",
    type: "custom",
    category: "site_audit",
    apiKeyName: "",
    status: "configured",
    description: "Uptime and health monitoring",
  },
  {
    id: "api-analysis",
    name: "API Analysis",
    service: "Google Gemini API",
    type: "api",
    category: "api",
    apiKeyName: "GEMINI_API_KEY",
    status: "not_configured",
    description: "AI-powered performance recommendations",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
  },
  {
    id: "posthog",
    name: "Analytics",
    service: "PostHog",
    type: "api",
    category: "api",
    apiKeyName: "POSTHOG_API_KEY",
    status: "not_configured",
    description: "User analytics and event tracking",
    endpoint: "https://app.posthog.com",
  },
];

export default function ToolsManagementPage() {
  const [securityTools, setSecurityTools] = useState<SecurityTool[]>([]);
  const [loadingSecurityTools, setLoadingSecurityTools] = useState(false);
  const [toolCategoryTab, setToolCategoryTab] = useState("site_audit");
  const [toolApiKeys, setToolApiKeys] = useState<Record<string | number, string>>({});
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<UnifiedTool | null>(null);
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingTool, setViewingTool] = useState<UnifiedTool | null>(null);

  useEffect(() => {
    loadSecurityTools();
  }, []);

  const makeAuthenticatedRequest = async (url: string, method: string = 'GET', data?: any) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error("No access token found");
    }

    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    return { data: await response.json() };
  };

  const loadSecurityTools = async () => {
    try {
      setLoadingSecurityTools(true);
      const apiBase = getApiBaseUrl();
      const response = await makeAuthenticatedRequest(`${apiBase}/api/security/tools/`);
      setSecurityTools(response.data);
      // Initialize API keys from loaded tools
      const keys: Record<number, string> = {};
      response.data.forEach((tool: SecurityTool) => {
        if (tool.api_key) {
          keys[tool.id] = tool.api_key;
        }
      });
      setToolApiKeys(keys);
    } catch (error: any) {
      console.error("Error loading security tools:", error);
    } finally {
      setLoadingSecurityTools(false);
    }
  };

  const handleOpenApiKeyModal = (tool: UnifiedTool) => {
    setEditingTool(tool);
    if (tool.source === 'security') {
      setApiKeyValue(toolApiKeys[tool.id] || tool.api_key || '');
    } else {
      setApiKeyValue(toolApiKeys[tool.id] || '');
    }
    setApiKeyModalOpen(true);
  };

  const handleSaveApiKey = async () => {
    if (!editingTool) return;

    try {
      if (editingTool.source === 'security') {
        const apiBase = getApiBaseUrl();
        await makeAuthenticatedRequest(
          `${apiBase}/api/security/tools/${editingTool.id}/`,
          'PATCH',
          { api_key: apiKeyValue }
        );
        await loadSecurityTools();
        toast.success("API key saved successfully");
      } else {
        const apiBase = getApiBaseUrl();
        const response = await fetch(
          `${apiBase}/api/admin-tools/tools/${editingTool.id}/api-key/`,
          {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: JSON.stringify({ 
              apiKey: apiKeyValue, 
              keyName: editingTool.apiKeyName 
            }),
          }
        );

        if (response.ok) {
          setToolApiKeys(prev => ({ ...prev, [editingTool.id]: apiKeyValue }));
          toast.success(`${editingTool.name} API key saved successfully`);
        } else {
          throw new Error('Failed to save API key');
        }
      }
      setApiKeyModalOpen(false);
      setEditingTool(null);
      setApiKeyValue("");
    } catch (error: any) {
      console.error("Error saving API key:", error);
      toast.error(error.message || "Failed to save API key");
    }
  };

  const getStatusBadge = (tool: UnifiedTool) => {
    if (tool.source === 'security') {
      const actualStatus = tool.actual_status || {};
      const status = actualStatus.status || tool.status;
      const isInstalled = actualStatus.installed !== false;
      
      if (status === 'configured' || status === 'available') {
        return (
          <Badge className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
      } else if (status === 'error') {
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      } else {
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
            <XCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
      }
    } else {
      if (tool.status === "configured") {
        return (
          <Badge className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Configured
          </Badge>
        );
      } else if (tool.status === "error") {
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      } else {
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
            <XCircle className="h-3 w-3 mr-1" />
            Not Configured
          </Badge>
        );
      }
    }
  };

  const getTypeBadge = (tool: UnifiedTool) => {
    if (tool.source === 'security') {
      if (tool.tool_type === 'api') {
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-700">
            <Globe className="h-3 w-3 mr-1" />
            API Service
          </Badge>
        );
      } else if (tool.tool_type === 'external') {
        return (
          <Badge variant="outline" className="border-purple-500 text-purple-700">
            <Code className="h-3 w-3 mr-1" />
            External Binary
          </Badge>
        );
      } else {
        return (
          <Badge variant="outline" className="border-green-500 text-green-700">
            <Code className="h-3 w-3 mr-1" />
            Built-in
          </Badge>
        );
      }
    } else {
      if (tool.type === "api") {
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-700">
            <Globe className="h-3 w-3 mr-1" />
            External API
          </Badge>
        );
      } else {
        return (
          <Badge variant="outline" className="border-purple-500 text-purple-700">
            <Code className="h-3 w-3 mr-1" />
            Custom Code
          </Badge>
        );
      }
    }
  };

  // Calculate metrics
  const allTools: UnifiedTool[] = [
    ...PLATFORM_TOOLS.map(t => ({ ...t, source: 'platform' as const })),
    ...securityTools.map(t => ({ ...t, source: 'security' as const }))
  ];
  
  const totalTools = allTools.length;
  const installedCount = securityTools.filter(t => (t.actual_status || {}).installed !== false).length + 
    PLATFORM_TOOLS.filter(t => t.status === "configured").length;
  const siteAuditCount = allTools.filter(t => t.category === 'site_audit').length;
  const securityCount = allTools.filter(t => t.category === 'security').length;
  const apiCount = allTools.filter(t => t.category === 'api').length;

  // Get tools by category
  const siteAuditTools = allTools.filter(t => t.category === 'site_audit');
  const securityToolsList = allTools.filter(t => t.category === 'security');
  const apiTools = allTools.filter(t => t.category === 'api');

  const getToolIcon = (tool: UnifiedTool) => {
    if (tool.source === 'security') {
      if (tool.name.includes('ZAP')) return Shield;
      if (tool.name.includes('Nmap')) return Server;
      if (tool.name.includes('Nikto')) return Shield;
      if (tool.name.includes('SSL')) return Shield;
      if (tool.name.includes('DNS')) return Server;
      if (tool.name.includes('Headers')) return Shield;
      return Activity;
    } else {
      if (tool.name.includes('Performance')) return Zap;
      if (tool.name.includes('SSL')) return Shield;
      if (tool.name.includes('DNS')) return Server;
      if (tool.name.includes('Typography')) return Type;
      if (tool.name.includes('Link')) return Link2;
      if (tool.name.includes('Sitemap')) return FileText;
      if (tool.name.includes('Monitoring')) return Activity;
      if (tool.name.includes('API Analysis')) return Brain;
      if (tool.name.includes('Analytics')) return BarChart3;
      return Settings;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-h4-dynamic font-bold">Tools Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage and configure all tools used across Site Audit, Security, API, and Performance features
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h1-dynamic font-bold">{totalTools}</div>
            <p className="text-xs text-muted-foreground mt-1">All categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Installed/Configured
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h1-dynamic font-bold text-green-600">
              {installedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ready to use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              Security Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h1-dynamic font-bold text-blue-600">
              {securityCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Security category</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              API Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h1-dynamic font-bold text-purple-600">
              {apiCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">API category</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs with Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tools</CardTitle>
          <CardDescription>Configure and manage tools organized by feature category</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSecurityTools ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-palette-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading tools...</p>
            </div>
          ) : (
            <Tabs value={toolCategoryTab} onValueChange={setToolCategoryTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="site_audit">Site Audit ({siteAuditCount})</TabsTrigger>
                <TabsTrigger value="security">Security ({securityCount})</TabsTrigger>
                <TabsTrigger value="api">API ({apiCount})</TabsTrigger>
              </TabsList>

              {/* Site Audit Tools */}
              <TabsContent value="site_audit" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tool</TableHead>
                      <TableHead>Service/Implementation</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>API Key</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {siteAuditTools.map((tool) => {
                      const Icon = getToolIcon(tool);
                      const hasApiKey = (tool.source === 'security' && tool.tool_type === 'api') || 
                                       (tool.source === 'platform' && tool.type === 'api' && tool.apiKeyName);
                      const currentApiKey = toolApiKeys[tool.id] || 
                                          (tool.source === 'security' ? tool.api_key : '');
                      
                      return (
                        <TableRow key={tool.source === 'security' ? `security-${tool.id}` : tool.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Icon className="h-5 w-5 text-palette-primary" />
                              <div>
                                <div className="font-medium text-slate-800">
                                  {tool.name}
                                </div>
                                <div className="text-sm text-slate-500">
                                  {tool.description}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-700">
                            {tool.source === 'security' 
                              ? `${tool.tool_type} (${tool.installation_instructions ? 'Installed' : 'Not Installed'})`
                              : tool.service}
                          </TableCell>
                          <TableCell>{getTypeBadge(tool)}</TableCell>
                          <TableCell>{getStatusBadge(tool)}</TableCell>
                          <TableCell>
                            {hasApiKey ? (
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                                  {currentApiKey ? `${String(currentApiKey).substring(0, 8)}...` : 'Not Set'}
                                </code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleOpenApiKeyModal(tool)}
                                >
                                  <Key className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-sm">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setViewingTool(tool);
                                  setViewModalOpen(true);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {siteAuditTools.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No Site Audit tools configured
                  </div>
                )}
              </TabsContent>

              {/* Security Tools */}
              <TabsContent value="security" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tool</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>API Key</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {securityToolsList.map((tool) => {
                      const Icon = getToolIcon(tool);
                      const hasApiKey = tool.source === 'security' && tool.tool_type === 'api';
                      const currentApiKey = toolApiKeys[tool.id] || 
                                          (tool.source === 'security' ? tool.api_key : '');
                      
                      return (
                        <TableRow key={`security-${tool.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Icon className="h-5 w-5 text-palette-primary" />
                              <div>
                                <div className="font-medium text-slate-800">
                                  {tool.name}
                                </div>
                                <div className="text-sm text-slate-500">
                                  {tool.description}
                                </div>
                                {tool.source === 'security' && tool.actual_status?.version && (
                                  <div className="text-xs text-slate-400 mt-1">
                                    Version: {tool.actual_status.version}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getTypeBadge(tool)}</TableCell>
                          <TableCell>{getStatusBadge(tool)}</TableCell>
                          <TableCell>
                            {hasApiKey ? (
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                                  {currentApiKey ? `${String(currentApiKey).substring(0, 8)}...` : 'Not Set'}
                                </code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleOpenApiKeyModal(tool)}
                                >
                                  <Key className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-sm">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setViewingTool(tool);
                                setViewModalOpen(true);
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {securityToolsList.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No Security tools configured
                  </div>
                )}
              </TabsContent>

              {/* API Tools */}
              <TabsContent value="api" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tool</TableHead>
                      <TableHead>Service/Implementation</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>API Key</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiTools.map((tool) => {
                      const Icon = getToolIcon(tool);
                      const hasApiKey = (tool.source === 'security' && tool.tool_type === 'api') || 
                                       (tool.source === 'platform' && tool.type === 'api' && tool.apiKeyName);
                      const currentApiKey = toolApiKeys[tool.id] || 
                                          (tool.source === 'security' ? tool.api_key : '');
                      
                      return (
                        <TableRow key={tool.source === 'security' ? `security-${tool.id}` : tool.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Icon className="h-5 w-5 text-palette-primary" />
                              <div>
                                <div className="font-medium text-slate-800">
                                  {tool.name}
                                </div>
                                <div className="text-sm text-slate-500">
                                  {tool.description}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-700">
                            {tool.source === 'security' 
                              ? tool.api_url || `${tool.tool_type}`
                              : tool.service}
                          </TableCell>
                          <TableCell>{getTypeBadge(tool)}</TableCell>
                          <TableCell>{getStatusBadge(tool)}</TableCell>
                          <TableCell>
                            {hasApiKey ? (
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                                  {currentApiKey ? `${String(currentApiKey).substring(0, 8)}...` : 'Not Set'}
                                </code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleOpenApiKeyModal(tool)}
                                >
                                  <Key className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-sm">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setViewingTool(tool);
                                  setViewModalOpen(true);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {apiTools.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No API tools configured
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* API Key Modal */}
      <Dialog open={apiKeyModalOpen} onOpenChange={setApiKeyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure API Key</DialogTitle>
            <DialogDescription>
              {editingTool && `Enter the API key for ${editingTool.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKeyValue}
                onChange={(e) => setApiKeyValue(e.target.value)}
                placeholder={editingTool && editingTool.source === 'platform' 
                  ? `Enter ${editingTool.apiKeyName}` 
                  : "Enter API key"}
                className="mt-1"
              />
              {editingTool && editingTool.source === 'platform' && editingTool.apiKeyName && (
                <p className="text-xs text-muted-foreground mt-1">
                  Environment variable: {editingTool.apiKeyName}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setApiKeyModalOpen(false);
              setEditingTool(null);
              setApiKeyValue("");
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveApiKey}>
              Save API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tool Details</DialogTitle>
            <DialogDescription>
              {viewingTool && `Detailed information for ${viewingTool.name}`}
            </DialogDescription>
          </DialogHeader>
          {viewingTool && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-muted-foreground mt-1">{viewingTool.description}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Service/Implementation</Label>
                <p className="text-sm text-muted-foreground mt-1 font-mono">
                  {viewingTool.source === 'security' 
                    ? `${viewingTool.tool_type}${viewingTool.executable_path ? ` - ${viewingTool.executable_path}` : ''}`
                    : viewingTool.service}
                </p>
              </div>

              {viewingTool.source === 'security' && (
                <>
                  {viewingTool.installation_instructions && (
                    <div>
                      <Label className="text-sm font-medium">Installation Instructions</Label>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                        {viewingTool.installation_instructions}
                      </p>
                    </div>
                  )}
                  
                  {viewingTool.actual_status?.path && (
                    <div>
                      <Label className="text-sm font-medium">Executable Path</Label>
                      <p className="text-sm text-muted-foreground mt-1 font-mono">
                        {viewingTool.actual_status.path}
                      </p>
                    </div>
                  )}

                  {viewingTool.actual_status?.version && (
                    <div>
                      <Label className="text-sm font-medium">Version</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {viewingTool.actual_status.version}
                      </p>
                    </div>
                  )}

                  {viewingTool.api_url && (
                    <div>
                      <Label className="text-sm font-medium">API URL</Label>
                      <p className="text-sm text-muted-foreground mt-1 font-mono">
                        {viewingTool.api_url}
                      </p>
                    </div>
                  )}

                  {viewingTool.supported_scan_types && viewingTool.supported_scan_types.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Supported Scan Types</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {viewingTool.supported_scan_types.map((scanType: string) => (
                          <Badge key={scanType} variant="outline">
                            {scanType}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingTool.actual_status?.message && (
                    <div>
                      <Label className="text-sm font-medium">Status Message</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {viewingTool.actual_status.message}
                      </p>
                    </div>
                  )}

                  {viewingTool.documentation_url && (
                    <div>
                      <Label className="text-sm font-medium">Documentation</Label>
                      <div className="mt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(viewingTool.documentation_url, '_blank')}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Open Documentation
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {viewingTool.source === 'platform' && (
                <>
                  {viewingTool.endpoint && (
                    <div>
                      <Label className="text-sm font-medium">Endpoint</Label>
                      <p className="text-sm text-muted-foreground mt-1 font-mono">
                        {viewingTool.endpoint}
                      </p>
                    </div>
                  )}

                  {viewingTool.apiKeyName && (
                    <div>
                      <Label className="text-sm font-medium">Environment Variable</Label>
                      <p className="text-sm text-muted-foreground mt-1 font-mono">
                        {viewingTool.apiKeyName}
                      </p>
                    </div>
                  )}

                  {viewingTool.endpoint && (
                    <div>
                      <Label className="text-sm font-medium">Documentation</Label>
                      <div className="mt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(viewingTool.endpoint, '_blank')}
                        >
                          <Globe className="h-3 w-3 mr-1" />
                          Visit Endpoint
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setViewModalOpen(false);
              setViewingTool(null);
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
