"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { applyTheme } from "@/lib/theme";
import {
  Settings,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  X,
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
} from "lucide-react";
import { getApiBaseUrl } from "@/lib/api-config";
import axios from "axios";
import { toast } from "sonner";

interface Tool {
  id: string;
  name: string;
  service: string;
  type: "api" | "custom";
  apiKey?: string;
  apiKeyName: string;
  status: "configured" | "not_configured" | "error";
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  endpoint?: string;
  lastChecked?: string;
}

const TOOLS: Tool[] = [
  {
    id: "performance",
    name: "Performance Analysis",
    service: "Google PageSpeed Insights API",
    type: "api",
    apiKeyName: "PAGESPEED_API_KEY",
    status: "not_configured",
    description: "Website speed and optimization analysis",
    icon: Zap,
    endpoint: "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
  },
  {
    id: "ssl",
    name: "SSL Certificate Check",
    service: "Custom Code (Node.js TLS/DNS)",
    type: "custom",
    apiKeyName: "",
    status: "configured",
    description: "SSL certificate validation and expiration checking",
    icon: Shield,
  },
  {
    id: "dns",
    name: "DNS Analysis",
    service: "Custom Code (Node.js DNS)",
    type: "custom",
    apiKeyName: "",
    status: "configured",
    description: "DNS record lookup and configuration analysis",
    icon: Server,
  },
  {
    id: "typography",
    name: "Typography Analysis",
    service: "Puppeteer (Custom Code)",
    type: "custom",
    apiKeyName: "",
    status: "configured",
    description: "Font analysis and typography recommendations",
    icon: Type,
  },
  {
    id: "links",
    name: "Link Validation",
    service: "Custom Code (Fetch/HTML Parsing)",
    type: "custom",
    apiKeyName: "",
    status: "configured",
    description: "Broken link detection and validation",
    icon: Link2,
  },
  {
    id: "sitemap",
    name: "Sitemap Analysis",
    service: "Custom Code (Fetch/XML Parsing)",
    type: "custom",
    apiKeyName: "",
    status: "configured",
    description: "Sitemap structure and validation",
    icon: FileText,
  },
  {
    id: "monitor",
    name: "Website Monitoring",
    service: "Custom Code (Fetch)",
    type: "custom",
    apiKeyName: "",
    status: "configured",
    description: "Uptime and health monitoring",
    icon: Activity,
  },
  {
    id: "api-analysis",
    name: "API Analysis",
    service: "Google Gemini API",
    type: "api",
    apiKeyName: "GEMINI_API_KEY",
    status: "not_configured",
    description: "AI-powered performance recommendations",
    icon: Brain,
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
  },
  {
    id: "posthog",
    name: "Analytics",
    service: "PostHog",
    type: "api",
    apiKeyName: "POSTHOG_API_KEY",
    status: "not_configured",
    description: "User analytics and event tracking",
    icon: BarChart3,
    endpoint: "https://app.posthog.com",
  },
];

export default function ToolsManagementPage() {
  const [tools, setTools] = useState<Tool[]>(TOOLS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkToolStatuses();
  }, []);

  const checkToolStatuses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }

      const apiBase = getApiBaseUrl();
      // Check which API keys are configured
      // This would ideally come from a backend endpoint that checks env vars
      // For now, we'll check client-side by trying to read from a config endpoint
      
      // Update tool statuses based on API key availability
      const updatedTools = tools.map((tool) => {
        if (tool.type === "api" && tool.apiKeyName) {
          // In a real implementation, this would check the backend
          // For now, we'll show "not_configured" as default
          return { ...tool, status: "not_configured" as const };
        }
        return tool;
      });

      setTools(updatedTools);
    } catch (error) {
      console.error("Error checking tool statuses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tool: Tool) => {
    setEditingId(tool.id);
    setEditValue(tool.apiKey || "");
  };

  const handleSave = async (toolId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const tool = tools.find((t) => t.id === toolId);
      if (!tool || !tool.apiKeyName) {
        toast.error("Cannot save API key for this tool");
        return;
      }

      const apiBase = getApiBaseUrl();
      // Save API key to backend
      // This would update environment variables or a secure key store
      const response = await axios.post(
        `${apiBase}/api/admin-tools/tools/${toolId}/api-key/`,
        { apiKey: editValue, keyName: tool.apiKeyName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200 || response.status === 201) {
        // Update local state
        setTools(
          tools.map((t) =>
            t.id === toolId
              ? {
                  ...t,
                  apiKey: editValue,
                  status: editValue ? "configured" : "not_configured",
                }
              : t
          )
        );
        setEditingId(null);
        setEditValue("");
        toast.success(`${tool?.name} API key saved successfully`);
      }
    } catch (error: any) {
      console.error("Error saving API key:", error);
      toast.error(
        error.response?.data?.error || "Failed to save API key"
      );
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "configured":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Configured
          </Badge>
        );
      case "not_configured":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
            <XCircle className="h-3 w-3 mr-1" />
            Not Configured
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === "api") {
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-700">
          <Globe className="h-3 w-3 mr-1" />
          External API
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-purple-500 text-purple-700">
        <Code className="h-3 w-3 mr-1" />
        Custom Code
      </Badge>
    );
  };

  return (
    <div className={applyTheme.page()}>
      <Card>
        <CardHeader>
          <CardTitle>Platform Tools & Integrations</CardTitle>
          <CardDescription>
            View and configure API keys for external services, or see custom code implementations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-palette-primary mx-auto"></div>
              <p className="text-slate-600 mt-4">Loading tools...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool</TableHead>
                  <TableHead>Service/Implementation</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  const isEditing = editingId === tool.id;

                  return (
                    <TableRow key={tool.id}>
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
                        {tool.service}
                      </TableCell>
                      <TableCell>{getTypeBadge(tool.type)}</TableCell>
                      <TableCell>{getStatusBadge(tool.status)}</TableCell>
                      <TableCell>
                        {tool.type === "api" && tool.apiKeyName ? (
                          isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="password"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                placeholder={`Enter ${tool.apiKeyName}`}
                                className="w-64"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSave(tool.id)}
                                variant="default"
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleCancel}
                                variant="outline"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                                {tool.apiKey
                                  ? `${tool.apiKey.substring(0, 8)}...`
                                  : tool.apiKeyName}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(tool)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          )
                        ) : (
                          <span className="text-slate-400 text-sm">
                            N/A (Custom Code)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {tool.endpoint && (
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="text-xs"
                          >
                            <a
                              href={tool.endpoint}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Globe className="h-3 w-3 mr-1" />
                              Endpoint
                            </a>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Tool Integration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">
                {tools.filter((t) => t.type === "api").length}
              </div>
              <div className="text-sm text-blue-600">External APIs</div>
            </div>
            <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">
                {tools.filter((t) => t.type === "custom").length}
              </div>
              <div className="text-sm text-purple-600">Custom Code</div>
            </div>
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {tools.filter((t) => t.status === "configured").length}
              </div>
              <div className="text-sm text-green-600">Configured</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

