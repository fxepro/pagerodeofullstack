"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Globe,
  Languages,
  Package,
  FileCode,
  Code,
  Database,
  Scan,
  Check
} from "lucide-react";
import { applyTheme } from "@/lib/theme";
import { usePermissions } from "@/hooks/use-permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDjangoApiUrl } from "@/lib/api-config";

// Language data
interface Language {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
  status: 'active' | 'inactive' | 'pending';
  translationComplete: number; // Percentage
  lastUpdated: string | null;
  fontSupport: boolean;
  localeFile: string;
}

interface PackageInfo {
  name: string;
  type: 'frontend' | 'backend' | 'api';
  purpose: string;
  status: 'used' | 'not-used' | 'planned';
  version?: string;
}

interface ImplementationStatus {
  id?: number;
  page_route: string;
  component_path: string;
  page_type: string;
  status: 'implemented' | 'partial' | 'not-implemented';
  last_checked: string;
  auto_discovered?: boolean;
}

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

// Helper function to refresh token
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    return null;
  }
  
  try {
    const res = await axios.post(`${API_BASE}/api/token/refresh/`, {
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

// Helper function to make authenticated request with retry
const makeAuthenticatedRequest = async (url: string, method: string = 'GET', data?: any) => {
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
    if (method === 'GET') {
      return await axios.get(url, config);
    } else if (method === 'POST') {
      return await axios.post(url, data, config);
    } else if (method === 'PATCH') {
      return await axios.patch(url, data, config);
    } else if (method === 'PUT') {
      return await axios.put(url, data, config);
    } else if (method === 'DELETE') {
      return await axios.delete(url, config);
    }
    throw new Error(`Unsupported HTTP method: ${method}`);
  } catch (err: any) {
    if (err.response?.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
        if (method === 'GET') {
          return await axios.get(url, config);
        } else if (method === 'POST') {
          return await axios.post(url, data, config);
        } else if (method === 'PATCH') {
          return await axios.patch(url, data, config);
        } else if (method === 'PUT') {
          return await axios.put(url, data, config);
        } else if (method === 'DELETE') {
          return await axios.delete(url, config);
        }
      }
      throw err;
    }
    throw err;
  }
};

export default function MultiLanguagePage() {
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [rtlFilter, setRtlFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Language implementation data
  const [languages, setLanguages] = useState<Language[]>([
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      rtl: false,
      status: 'active',
      translationComplete: 100,
      lastUpdated: '2024-01-01',
      fontSupport: true,
      localeFile: 'studio/lib/locales/en/common.json',
    },
    {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      rtl: false,
      status: 'active',
      translationComplete: 85,
      lastUpdated: '2024-01-01',
      fontSupport: true,
      localeFile: 'studio/lib/locales/es/common.json',
    },
    {
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      rtl: false,
      status: 'active',
      translationComplete: 80,
      lastUpdated: '2024-01-01',
      fontSupport: true,
      localeFile: 'studio/lib/locales/fr/common.json',
    },
    {
      code: 'de',
      name: 'German',
      nativeName: 'Deutsch',
      rtl: false,
      status: 'active',
      translationComplete: 75,
      lastUpdated: '2024-01-01',
      fontSupport: true,
      localeFile: 'studio/lib/locales/de/common.json',
    },
    {
      code: 'it',
      name: 'Italian',
      nativeName: 'Italiano',
      rtl: false,
      status: 'active',
      translationComplete: 70,
      lastUpdated: '2024-01-01',
      fontSupport: true,
      localeFile: 'studio/lib/locales/it/common.json',
    },
    {
      code: 'pt',
      name: 'Portuguese',
      nativeName: 'Português',
      rtl: false,
      status: 'active',
      translationComplete: 70,
      lastUpdated: '2024-01-01',
      fontSupport: true,
      localeFile: 'studio/lib/locales/pt/common.json',
    },
    {
      code: 'ru',
      name: 'Russian',
      nativeName: 'Русский',
      rtl: false,
      status: 'active',
      translationComplete: 65,
      lastUpdated: '2024-01-01',
      fontSupport: true,
      localeFile: 'studio/lib/locales/ru/common.json',
    },
    {
      code: 'sv',
      name: 'Swedish',
      nativeName: 'Svenska',
      rtl: false,
      status: 'active',
      translationComplete: 60,
      lastUpdated: '2024-01-01',
      fontSupport: true,
      localeFile: 'studio/lib/locales/sv/common.json',
    },
    {
      code: 'no',
      name: 'Norwegian',
      nativeName: 'Norsk',
      rtl: false,
      status: 'active',
      translationComplete: 60,
      lastUpdated: '2024-01-01',
      fontSupport: true,
      localeFile: 'studio/lib/locales/no/common.json',
    },
    {
      code: 'da',
      name: 'Danish',
      nativeName: 'Dansk',
      rtl: false,
      status: 'active',
      translationComplete: 60,
      lastUpdated: '2024-01-01',
      fontSupport: true,
      localeFile: 'studio/lib/locales/da/common.json',
    },
    {
      code: 'zh',
      name: 'Chinese (Simplified)',
      nativeName: '简体中文',
      rtl: false,
      status: 'active',
      translationComplete: 55,
      lastUpdated: '2024-01-01',
      fontSupport: true,
      localeFile: 'studio/lib/locales/zh/common.json',
    },
    {
      code: 'ja',
      name: 'Japanese',
      nativeName: '日本語',
      rtl: false,
      status: 'active',
      translationComplete: 50,
      lastUpdated: '2024-01-01',
      fontSupport: true,
      localeFile: 'studio/lib/locales/ja/common.json',
    },
    {
      code: 'ko',
      name: 'Korean',
      nativeName: '한국어',
      rtl: false,
      status: 'active',
      translationComplete: 50,
      lastUpdated: '2024-01-01',
      fontSupport: true,
      localeFile: 'studio/lib/locales/ko/common.json',
    },
    {
      code: 'hi',
      name: 'Hindi',
      nativeName: 'हिन्दी',
      rtl: false,
      status: 'active',
      translationComplete: 45,
      lastUpdated: '2024-01-01',
      fontSupport: true,
      localeFile: 'studio/lib/locales/hi/common.json',
    },
    {
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      rtl: true,
      status: 'active',
      translationComplete: 40,
      lastUpdated: '2024-01-01',
      fontSupport: true,
      localeFile: 'studio/lib/locales/ar/common.json',
    },
    {
      code: 'he',
      name: 'Hebrew',
      nativeName: 'עברית',
      rtl: true,
      status: 'active',
      translationComplete: 40,
      lastUpdated: '2024-01-01',
      fontSupport: true,
      localeFile: 'studio/lib/locales/he/common.json',
    },
  ]);

  // Packages data
  const [packages, setPackages] = useState<PackageInfo[]>([
    {
      name: 'react-i18next',
      type: 'frontend',
      purpose: 'React bindings for i18next',
      status: 'used',
      version: 'latest',
    },
    {
      name: 'i18next',
      type: 'frontend',
      purpose: 'Core internationalization framework',
      status: 'used',
      version: 'latest',
    },
    {
      name: 'i18next-browser-languagedetector',
      type: 'frontend',
      purpose: 'Automatic language detection from browser/localStorage',
      status: 'used',
      version: 'latest',
    },
    {
      name: 'Intl.NumberFormat',
      type: 'frontend',
      purpose: 'Number and currency formatting (built-in JavaScript)',
      status: 'used',
    },
    {
      name: 'Intl.DateTimeFormat',
      type: 'frontend',
      purpose: 'Date and time formatting (built-in JavaScript)',
      status: 'used',
    },
    {
      name: 'django-modeltranslation',
      type: 'backend',
      purpose: 'Django model translation (if needed)',
      status: 'not-used',
    },
    {
      name: 'django-parler',
      type: 'backend',
      purpose: 'Django multilingual models',
      status: 'not-used',
    },
  ]);

  // Implementation status data - Fetched from API
  const [implementationStatus, setImplementationStatus] = useState<ImplementationStatus[]>([]);
  
  // Fetch pages from API
  const fetchPages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await makeAuthenticatedRequest(
        getDjangoApiUrl('/multilanguage/pages/')
      );
      setImplementationStatus(response.data);
    } catch (err: any) {
      console.error('Error fetching pages:', err);
      setError(err.response?.data?.error || 'Failed to fetch pages');
    } finally {
      setLoading(false);
    }
  };

  // Scan for new pages
  const handleScanPages = async () => {
    setScanning(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await makeAuthenticatedRequest(
        getDjangoApiUrl('/multilanguage/pages/scan_pages/'),
        'POST'
      );
      setSuccessMessage(
        `Scan complete! Found ${response.data.new_pages} new pages, updated ${response.data.updated_pages} existing pages.`
      );
      // Refresh the pages list
      await fetchPages();
    } catch (err: any) {
      console.error('Error scanning pages:', err);
      setError(err.response?.data?.error || 'Failed to scan pages');
    } finally {
      setScanning(false);
    }
  };

  // Mark page as complete
  const handleMarkComplete = async (pageId: number) => {
    setError(null);
    setSuccessMessage(null);
    try {
      await makeAuthenticatedRequest(
        getDjangoApiUrl(`/multilanguage/pages/${pageId}/mark_complete/`),
        'POST'
      );
      setSuccessMessage('Page marked as complete!');
      // Refresh the pages list
      await fetchPages();
    } catch (err: any) {
      console.error('Error marking page complete:', err);
      setError(err.response?.data?.error || 'Failed to mark page as complete');
    }
  };

  // Update page status
  const handleUpdateStatus = async (pageId: number, newStatus: 'implemented' | 'partial' | 'not-implemented') => {
    setError(null);
    setSuccessMessage(null);
    try {
      await makeAuthenticatedRequest(
        getDjangoApiUrl(`/multilanguage/pages/${pageId}/update_status/`),
        'PATCH',
        { status: newStatus }
      );
      setSuccessMessage('Status updated!');
      // Refresh the pages list
      await fetchPages();
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.error || 'Failed to update status');
    }
  };

  // Fetch pages on mount
  useEffect(() => {
    fetchPages();
  }, []);

  // Check permission
  useEffect(() => {
    if (!hasPermission('users.view')) {
      // Handle permission error
    }
  }, [hasPermission]);

  // Filter languages
  const filteredLanguages = languages.filter((language) => {
    const matchesSearch = searchTerm === "" || 
      language.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      language.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      language.nativeName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || language.status === statusFilter;
    const matchesRtl = rtlFilter === "all" || (rtlFilter === "rtl" && language.rtl) || (rtlFilter === "ltr" && !language.rtl);
    
    return matchesSearch && matchesStatus && matchesRtl;
  });

  // Filter implementation status
  const filteredImplementation = implementationStatus.filter((item) => {
    const matchesSearch = searchTerm === "" || 
      item.page_route.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.component_path.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      active: { label: "Active", className: "bg-green-600 text-white" },
      inactive: { label: "Inactive", className: "bg-gray-600 text-white" },
      pending: { label: "Pending", className: "bg-yellow-600 text-white" },
      implemented: { label: "Implemented", className: "bg-green-600 text-white" },
      partial: { label: "Partial", className: "bg-yellow-600 text-white" },
      'not-implemented': { label: "Not Implemented", className: "bg-red-600 text-white" },
      used: { label: "Used", className: "bg-green-600 text-white" },
      'not-used': { label: "Not Used", className: "bg-gray-500 text-white" },
      planned: { label: "Planned", className: "bg-blue-600 text-white" },
    };
    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-600 text-white" };
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const getTranslationProgressColor = (percent: number) => {
    if (percent >= 80) return 'text-green-600';
    if (percent >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={applyTheme.page()}>
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${applyTheme.text('primary')}`}>Multi-Language</h1>
        <p className={`mt-2 ${applyTheme.text('secondary')}`}>
          Manage language implementations and track translation status across the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className={applyTheme.card()}>
          <CardContent className={applyTheme.cardContent()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${applyTheme.text('secondary')}`}>Total Languages</p>
                <p className="text-2xl font-bold text-blue-400">
                  {languages.length}
                </p>
              </div>
              <Languages className={`h-8 w-8 ${applyTheme.status('info')}`} />
            </div>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardContent className={applyTheme.cardContent()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${applyTheme.text('secondary')}`}>Active</p>
                <p className="text-2xl font-bold text-green-400">
                  {languages.filter(l => l.status === 'active').length}
                </p>
              </div>
              <CheckCircle2 className={`h-8 w-8 ${applyTheme.status('success')}`} />
            </div>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardContent className={applyTheme.cardContent()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${applyTheme.text('secondary')}`}>RTL Languages</p>
                <p className="text-2xl font-bold text-purple-400">
                  {languages.filter(l => l.rtl).length}
                </p>
              </div>
              <Globe className={`h-8 w-8 ${applyTheme.status('info')}`} />
            </div>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardContent className={applyTheme.cardContent()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${applyTheme.text('secondary')}`}>Avg Translation</p>
                <p className="text-2xl font-bold text-blue-400">
                  {Math.round(languages.reduce((sum, l) => sum + l.translationComplete, 0) / languages.length)}%
                </p>
              </div>
              <FileCode className={`h-8 w-8 ${applyTheme.status('info')}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className={applyTheme.card()}>
        <CardContent className={applyTheme.cardContent()}>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search languages, packages, or pages..."
                className="pl-10 bg-white border-slate-300 text-slate-800 placeholder-slate-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => setSearchTerm("")}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="languages" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="languages">
            <Languages className="h-4 w-4 mr-2" />
            Languages
          </TabsTrigger>
          <TabsTrigger value="status">
            <Search className="h-4 w-4 mr-2" />
            Status by Page
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Languages */}
        <TabsContent value="languages" className="mt-4">
          <Card className={applyTheme.card()}>
            <CardHeader className={applyTheme.cardHeader()}>
              <CardTitle className={applyTheme.text('primary')}>Supported Languages</CardTitle>
              <CardDescription className={applyTheme.text('secondary')}>
                All languages implemented across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Label>Status:</Label>
                  <select
                    className="px-3 py-1 border rounded"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <Label>Text Direction:</Label>
                  <select
                    className="px-3 py-1 border rounded"
                    value={rtlFilter}
                    onChange={(e) => setRtlFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="ltr">LTR</option>
                    <option value="rtl">RTL</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Language Code</TableHead>
                      <TableHead>Language Name</TableHead>
                      <TableHead>Native Name</TableHead>
                      <TableHead>Text Direction</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Translation Complete</TableHead>
                      <TableHead>Font Support</TableHead>
                      <TableHead>Locale File</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLanguages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2">
                            <Languages className="h-8 w-8 text-slate-400" />
                            <p className={applyTheme.text('secondary')}>No languages found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLanguages.map((language) => (
                        <TableRow key={language.code}>
                          <TableCell>
                            <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                              {language.code}
                            </code>
                          </TableCell>
                          <TableCell className="font-medium">{language.name}</TableCell>
                          <TableCell>{language.nativeName}</TableCell>
                          <TableCell>
                            {language.rtl ? (
                              <Badge variant="outline" className="text-purple-600">RTL</Badge>
                            ) : (
                              <Badge variant="outline" className="text-blue-600">LTR</Badge>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(language.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${language.translationComplete >= 80 ? 'bg-green-500' : language.translationComplete >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                  style={{ width: `${language.translationComplete}%` }}
                                />
                              </div>
                              <span className={`text-sm font-medium ${getTranslationProgressColor(language.translationComplete)}`}>
                                {language.translationComplete}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {language.fontSupport ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                              {language.localeFile.split('/').pop()}
                            </code>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-slate-500">
                              {language.lastUpdated 
                                ? new Date(language.lastUpdated).toLocaleDateString()
                                : 'N/A'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Packages Section */}
          <Card className={applyTheme.card() + " mt-6"}>
            <CardHeader className={applyTheme.cardHeader()}>
              <CardTitle className={applyTheme.text('primary')}>Packages & Libraries</CardTitle>
              <CardDescription className={applyTheme.text('secondary')}>
                Language-related packages and libraries used in the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Package Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Version</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.map((pkg, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{pkg.name}</TableCell>
                        <TableCell>
                          {pkg.type === 'frontend' && <Badge variant="outline" className="text-blue-600">Frontend</Badge>}
                          {pkg.type === 'backend' && <Badge variant="outline" className="text-green-600">Backend</Badge>}
                          {pkg.type === 'api' && <Badge variant="outline" className="text-purple-600">API</Badge>}
                        </TableCell>
                        <TableCell className="text-sm">{pkg.purpose}</TableCell>
                        <TableCell>{getStatusBadge(pkg.status)}</TableCell>
                        <TableCell>
                          {pkg.version ? (
                            <code className="text-xs bg-slate-100 px-2 py-1 rounded">{pkg.version}</code>
                          ) : (
                            <span className="text-xs text-slate-400">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Status by Page */}
        <TabsContent value="status" className="mt-4">
          <Card className={applyTheme.card()}>
            <CardHeader className={applyTheme.cardHeader()}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={applyTheme.text('primary')}>Implementation Status by Page</CardTitle>
                  <CardDescription className={applyTheme.text('secondary')}>
                    Search all pages and components for language implementation status
                  </CardDescription>
                </div>
                <Button
                  onClick={handleScanPages}
                  disabled={scanning}
                  className="ml-4"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Scan className="h-4 w-4 mr-2" />
                      Scan for New Pages
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              {successMessage && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                  {successMessage}
                </div>
              )}
              <div className="mb-4 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Label>Status:</Label>
                  <select
                    className="px-3 py-1 border rounded"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="implemented">Implemented</option>
                    <option value="partial">Partial</option>
                    <option value="not-implemented">Not Implemented</option>
                  </select>
                </div>
                <Button
                  onClick={fetchPages}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              {loading && implementationStatus.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="ml-2">Loading pages...</span>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page/Route</TableHead>
                      <TableHead>Component/File</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Checked</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredImplementation.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2">
                            <FileCode className="h-8 w-8 text-slate-400" />
                            <p className={applyTheme.text('secondary')}>
                              {loading ? 'Loading pages...' : 'No results found. Click "Scan for New Pages" to discover pages.'}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredImplementation.map((item) => (
                        <TableRow key={item.id || item.page_route}>
                          <TableCell className="font-medium">{item.page_route}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                              {item.component_path}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {item.page_type}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>
                            <span className="text-xs text-slate-500">
                              {new Date(item.last_checked).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {item.status !== 'implemented' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => item.id && handleMarkComplete(item.id)}
                                  className="text-xs"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Mark Complete
                                </Button>
                              )}
                              <select
                                value={item.status}
                                onChange={(e) => item.id && handleUpdateStatus(item.id, e.target.value as any)}
                                className="text-xs px-2 py-1 border rounded"
                              >
                                <option value="not-implemented">Not Implemented</option>
                                <option value="partial">Partial</option>
                                <option value="implemented">Implemented</option>
                              </select>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

