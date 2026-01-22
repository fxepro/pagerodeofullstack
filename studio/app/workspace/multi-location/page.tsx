"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Activity,
  Globe,
  Cpu,
  HardDrive
} from "lucide-react";
import { applyTheme, LAYOUT } from "@/lib/theme";
import { usePermissions } from "@/hooks/use-permissions";
import axios from "axios";
import { toast } from "sonner";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    } else if (method === 'PUT') {
      return await axios.put(url, data, config);
    } else if (method === 'DELETE') {
      return await axios.delete(url, config);
    }
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
        } else if (method === 'DELETE') {
          return await axios.delete(url, config);
        }
      }
      throw err;
    }
    throw err;
  }
};

interface Location {
  id: number;
  name: string;
  region_code: string;
  region_id: string;
  country: string;
  continent: string;
  status: 'ok' | 'warning' | 'down' | 'active' | 'inactive' | 'pending' | 'error';
  latency_ms: number | null;
  last_check: string | null;
  created_at: string;
  updated_at: string;
  runner_id?: string | null;
  cpu_load?: number | null;
  memory_used_mb?: number | null;
  memory_total_mb?: number | null;
  memory_percent?: number | null;
  current_jobs_running?: number;
  last_lighthouse_run_sec?: number | null;
  time_since_last_success?: number | null;
  can_accept_jobs?: boolean;
}

// Predefined AWS Lightsail regions
const AWS_LIGHTSAIL_REGIONS = [
  { name: "US East (N. Virginia)", region_code: "us-east-1", country: "United States", continent: "North America" },
  { name: "US East (Ohio)", region_code: "us-east-2", country: "United States", continent: "North America" },
  { name: "US West (Oregon)", region_code: "us-west-2", country: "United States", continent: "North America" },
  { name: "Canada (Central)", region_code: "ca-central-1", country: "Canada", continent: "North America" },
  { name: "Asia Pacific (Jakarta)", region_code: "ap-southeast-3", country: "Indonesia", continent: "Asia Pacific" },
  { name: "Asia Pacific (Mumbai)", region_code: "ap-south-1", country: "India", continent: "Asia Pacific" },
  { name: "Asia Pacific (Seoul)", region_code: "ap-northeast-2", country: "South Korea", continent: "Asia Pacific" },
  { name: "Asia Pacific (Singapore)", region_code: "ap-southeast-1", country: "Singapore", continent: "Asia Pacific" },
  { name: "Asia Pacific (Sydney)", region_code: "ap-southeast-2", country: "Australia", continent: "Asia Pacific" },
  { name: "Asia Pacific (Tokyo)", region_code: "ap-northeast-1", country: "Japan", continent: "Asia Pacific" },
  { name: "EU (Frankfurt)", region_code: "eu-central-1", country: "Germany", continent: "Europe" },
  { name: "EU (Ireland)", region_code: "eu-west-1", country: "Ireland", continent: "Europe" },
  { name: "EU (London)", region_code: "eu-west-2", country: "United Kingdom", continent: "Europe" },
  { name: "EU (Paris)", region_code: "eu-west-3", country: "France", continent: "Europe" },
  { name: "EU (Stockholm)", region_code: "eu-north-1", country: "Sweden", continent: "Europe" },
];

interface RunnerHealth {
  id: number;
  runner_id: string;
  location: number | null;
  location_name?: string;
  location_region_code?: string;
  region: string;
  status: 'ok' | 'warning' | 'down' | 'active' | 'inactive' | 'pending' | 'error';
  latency_ms: number | null;
  cpu_load: number | null;
  memory_percent: number | null;
  current_jobs_running: number;
  time_since_last_success: number | null;
  updated_at: string;
  can_accept_jobs: boolean;
}

export default function MultiLocationPage() {
  const { hasPermission } = usePermissions();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [runnerHealth, setRunnerHealth] = useState<RunnerHealth[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    region_code: "",
    region_id: "",
    country: "",
    continent: "",
  });

  // Check permission before loading
  useEffect(() => {
    if (!hasPermission('users.view')) {
      setError("You don't have permission to access this page. Admin access required.");
      setLoading(false);
      return;
    }
    fetchData();
  }, [hasPermission]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/workspace/login");
        return;
      }

      // Fetch locations
      const locationsResponse = await makeAuthenticatedRequest(`${API_BASE}/api/locations/`);
      setLocations(locationsResponse.data);

      // Fetch runner health data
      try {
        const runnersResponse = await makeAuthenticatedRequest(`${API_BASE}/api/runner-health/`);
        setRunnerHealth(runnersResponse.data);
      } catch (runnerError: any) {
        console.error("Error fetching runner health:", runnerError);
        // If runner health endpoint doesn't exist or fails, set empty array
        setRunnerHealth([]);
      }

      setError(null);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      if (error.response?.status === 403) {
        setError("You don't have permission to access this page. Admin access required.");
      } else if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.push("/workspace/login");
      } else {
        // If endpoint doesn't exist, use empty array (for now)
        setLocations([]);
        setRunnerHealth([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    const region = AWS_LIGHTSAIL_REGIONS.find(r => r.region_code === selectedRegion);
    if (region) {
      setFormData({
        name: region.name,
        region_code: region.region_code,
        region_id: region.region_code,
        country: region.country,
        continent: region.continent,
      });
    }
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      region_code: location.region_code,
      region_id: location.region_id,
      country: location.country,
      continent: location.continent,
    });
    setSelectedRegion(location.region_code);
    setIsEditDialogOpen(true);
  };

  const handleCheckLocation = async (id: number) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/workspace/login");
        return;
      }
      
      try {
        await axios.put(`${API_BASE}/api/locations/${id}/`, {
          status: 'active'
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Location activated successfully");
        fetchData();
      } catch (err: any) {
        if (err.response?.status === 401) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            await axios.put(`${API_BASE}/api/locations/${id}/`, {
              status: 'active'
            }, {
              headers: { Authorization: `Bearer ${newToken}` },
            });
            toast.success("Location activated successfully");
            fetchData();
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to activate location");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this location? This action cannot be undone.")) {
      return;
    }
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/workspace/login");
        return;
      }
      
      try {
        await axios.delete(`${API_BASE}/api/locations/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Location deleted successfully");
        fetchData();
      } catch (err: any) {
        if (err.response?.status === 401) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            await axios.delete(`${API_BASE}/api/locations/${id}/`, {
              headers: { Authorization: `Bearer ${newToken}` },
            });
            toast.success("Location deleted successfully");
            fetchData();
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete location");
    }
  };

  const handleSave = async () => {
    try {
      if (editingLocation) {
        // Update existing
        await makeAuthenticatedRequest(`${API_BASE}/api/locations/${editingLocation.id}/`, 'PUT', formData);
        toast.success("Location updated successfully");
      } else {
        // Create new
        const token = localStorage.getItem("access_token");
        if (!token) {
          router.push("/workspace/login");
          return;
        }
        
        try {
          const response = await axios.post(`${API_BASE}/api/locations/`, {
            ...formData,
            status: 'pending',
          }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success("Location created successfully");
        } catch (err: any) {
          if (err.response?.status === 401) {
            const newToken = await refreshAccessToken();
            if (newToken) {
              const response = await axios.post(`${API_BASE}/api/locations/`, {
                ...formData,
                status: 'pending',
              }, {
                headers: { Authorization: `Bearer ${newToken}` },
              });
              toast.success("Location created successfully");
            } else {
              throw err;
            }
          } else {
            throw err;
          }
        }
      }
      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      setEditingLocation(null);
      setFormData({
        name: "",
        region_code: "",
        region_id: "",
        country: "",
        continent: "",
      });
      setSelectedRegion("");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${editingLocation ? 'update' : 'create'} location`);
    }
  };

  const handleRegionSelect = (regionCode: string) => {
    setSelectedRegion(regionCode);
    const region = AWS_LIGHTSAIL_REGIONS.find(r => r.region_code === regionCode);
    if (region) {
      setFormData({
        name: region.name,
        region_code: region.region_code,
        region_id: region.region_code,
        country: region.country,
        continent: region.continent,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
      ok: { label: "OK", variant: "default", color: "text-green-600" },
      warning: { label: "Warning", variant: "outline", color: "text-yellow-600" },
      down: { label: "Down", variant: "destructive", color: "text-red-600" },
      active: { label: "Active", variant: "default", color: "text-green-600" },
      inactive: { label: "Inactive", variant: "secondary", color: "text-gray-600" },
      pending: { label: "Pending", variant: "outline", color: "text-yellow-600" },
      error: { label: "Error", variant: "destructive", color: "text-red-600" },
    };
    const statusInfo = statusMap[status] || { label: status, variant: "secondary" as const, color: "text-gray-600" };
    return <Badge variant={statusInfo.variant} className={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  const formatTimeSinceLastSuccess = (seconds: number | null | undefined): string => {
    if (seconds === null || seconds === undefined) return 'N/A';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const getCpuLoadColor = (load: number | null | undefined): string => {
    if (load === null || load === undefined) return 'text-gray-500';
    if (load < 0.5) return 'text-green-600';
    if (load < 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMemoryColor = (percent: number | null | undefined): string => {
    if (percent === null || percent === undefined) return 'text-gray-500';
    if (percent < 50) return 'text-green-600';
    if (percent < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const CpuLoadGauge = ({ load }: { load: number | null | undefined }) => {
    if (load === null || load === undefined) return <span className="text-gray-500">N/A</span>;
    const percent = Math.min(load * 100, 100);
    const color = load < 0.5 ? 'bg-green-500' : load < 0.8 ? 'bg-yellow-500' : 'bg-red-500';
    return (
      <div className="flex items-center space-x-2">
        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
        </div>
        <span className={`text-sm font-medium ${getCpuLoadColor(load)}`}>
          {load.toFixed(2)}
        </span>
      </div>
    );
  };

  const MemoryGauge = ({ percent }: { percent: number | null | undefined }) => {
    if (percent === null || percent === undefined) return <span className="text-gray-500">N/A</span>;
    const color = percent < 50 ? 'bg-green-500' : percent < 80 ? 'bg-yellow-500' : 'bg-red-500';
    return (
      <div className="flex items-center space-x-2">
        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
        </div>
        <span className={`text-sm font-medium ${getMemoryColor(percent)}`}>
          {percent.toFixed(1)}%
        </span>
      </div>
    );
  };

  const LatencyChart = ({ latency }: { latency: number | null | undefined }) => {
    if (latency === null || latency === undefined) return <span className="text-gray-500">N/A</span>;
    const color = latency < 100 ? 'text-green-600' : latency < 500 ? 'text-yellow-600' : 'text-red-600';
    return (
      <div className="flex items-center space-x-2">
        <div className="w-12 h-8 bg-gray-100 rounded flex items-end justify-center p-1">
          <div 
            className={`w-full rounded ${latency < 100 ? 'bg-green-500' : latency < 500 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ height: `${Math.min((latency / 1000) * 100, 100)}%` }}
          />
        </div>
        <span className={`text-sm font-medium ${color}`}>
          {latency}ms
        </span>
      </div>
    );
  };


  const filteredLocations = locations.filter((location) => {
    const matchesSearch = 
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.region_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.continent.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredRunnerHealth = runnerHealth.filter((runner) => {
    const matchesSearch = searchTerm === "" || 
      runner.runner_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      runner.region.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className={applyTheme.page()}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-palette-primary" />
          <span className="ml-2 text-slate-600">Loading locations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={applyTheme.page()}>
        <Card className={applyTheme.card()}>
          <CardContent className={applyTheme.cardContent()}>
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h4-dynamic font-bold">Multi-Location</h1>
          <p className="text-muted-foreground mt-1">Manage AWS Lightsail regions for PageSpeed/Lighthouse runners</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Stats Cards */}
      <div className={LAYOUT.statsGrid}>
        <Card className={applyTheme.card()}>
          <CardContent className={applyTheme.cardContent()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${applyTheme.text('secondary')}`}>Total Locations</p>
                <p className={`text-2xl font-bold ${applyTheme.text('primary')}`}>
                  {locations.length}
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
                <p className={`text-sm font-medium ${applyTheme.text('secondary')}`}>Active</p>
                <p className="text-h2-dynamic font-bold text-green-400">
                  {locations.filter(l => l.status === 'active').length}
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
                <p className={`text-sm font-medium ${applyTheme.text('secondary')}`}>Pending</p>
                <p className="text-h2-dynamic font-bold text-yellow-400">
                  {locations.filter(l => l.status === 'pending').length}
                </p>
              </div>
              <Activity className={`h-8 w-8 ${applyTheme.status('warning')}`} />
            </div>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardContent className={applyTheme.cardContent()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${applyTheme.text('secondary')}`}>Avg Latency</p>
                <p className="text-h2-dynamic font-bold text-blue-400">
                  {locations.filter(l => l.latency_ms !== null).length > 0
                    ? Math.round(
                        locations
                          .filter(l => l.latency_ms !== null)
                          .reduce((sum, l) => sum + (l.latency_ms || 0), 0) /
                        locations.filter(l => l.latency_ms !== null).length
                      )
                    : 'N/A'}
                  {locations.filter(l => l.latency_ms !== null).length > 0 && 'ms'}
                </p>
              </div>
              <Activity className={`h-8 w-8 ${applyTheme.status('info')}`} />
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
                placeholder="Search locations by name or country..."
                className="pl-10 bg-white border-slate-300 text-slate-800 placeholder-slate-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different location aspects */}
      <Tabs defaultValue="lighthouse-runners" className="w-full">
        <TabsList className="grid w-full grid-cols-1 lg:grid-cols-3">
          <TabsTrigger value="lighthouse-runners">
            <Activity className="h-4 w-4 mr-2" />
            Lighthouse Runners
          </TabsTrigger>
          {/* Future tabs can be added here */}
        </TabsList>

        {/* Lighthouse Runners Tab */}
        <TabsContent value="lighthouse-runners" className="mt-4">
          <Card className={applyTheme.card()}>
            <CardHeader className={applyTheme.cardHeader()}>
              <CardTitle className={applyTheme.text('primary')}>Lighthouse Runners ({filteredLocations.length})</CardTitle>
              <CardDescription className={applyTheme.text('secondary')}>
                PageSpeed/Lighthouse monitoring and health status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead>Runner ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Latency Chart</TableHead>
                      <TableHead>CPU Load Gauge</TableHead>
                      <TableHead>Memory %</TableHead>
                      <TableHead>Current Jobs Running</TableHead>
                      <TableHead>Time Since Last Success</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLocations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2">
                            <MapPin className="h-8 w-8 text-slate-400" />
                            <p className={applyTheme.text('secondary')}>No locations found</p>
                            <Button variant="outline" size="sm" onClick={handleCreate} className="mt-2">
                              <Plus className="h-4 w-4 mr-2" />
                              Add First Location
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLocations.map((location) => (
                        <TableRow key={location.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-slate-500" />
                              <span className="font-medium">{location.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                              {location.runner_id || 'N/A'}
                            </code>
                          </TableCell>
                          <TableCell>{getStatusBadge(location.status)}</TableCell>
                          <TableCell>
                            <LatencyChart latency={location.latency_ms} />
                          </TableCell>
                          <TableCell>
                            <CpuLoadGauge load={location.cpu_load} />
                          </TableCell>
                          <TableCell>
                            <MemoryGauge percent={location.memory_percent} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Activity className="h-4 w-4 text-slate-500" />
                              <span className="font-medium">{location.current_jobs_running || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {formatTimeSinceLastSuccess(location.time_since_last_success)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-slate-500">
                              {location.updated_at
                                ? new Date(location.updated_at).toLocaleString()
                                : 'Never'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {location.status !== 'active' && location.status !== 'ok' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCheckLocation(location.id)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Check
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(location)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDelete(location.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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

        {/* Future tabs can be added here */}
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
            <DialogDescription>
              Select an AWS Lightsail region to add for PageSpeed/Lighthouse monitoring
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Region</Label>
              <Select value={selectedRegion} onValueChange={handleRegionSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a region" />
                </SelectTrigger>
                <SelectContent>
                  {AWS_LIGHTSAIL_REGIONS.map((region) => (
                    <SelectItem key={region.region_code} value={region.region_code}>
                      {region.name} ({region.region_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedRegion && (
              <>
                <div>
                  <Label>Name</Label>
                  <Input value={formData.name} readOnly />
                </div>
                <div>
                  <Label>Region Code</Label>
                  <Input value={formData.region_code} readOnly />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input value={formData.country} readOnly />
                </div>
                <div>
                  <Label>Continent</Label>
                  <Input value={formData.continent} readOnly />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!selectedRegion}>
              Create Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update location details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Region</Label>
              <Select value={selectedRegion} onValueChange={handleRegionSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a region" />
                </SelectTrigger>
                <SelectContent>
                  {AWS_LIGHTSAIL_REGIONS.map((region) => (
                    <SelectItem key={region.region_code} value={region.region_code}>
                      {region.name} ({region.region_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Region Code</Label>
              <Input
                value={formData.region_code}
                onChange={(e) => setFormData({ ...formData, region_code: e.target.value })}
              />
            </div>
            <div>
              <Label>Country</Label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
            <div>
              <Label>Continent</Label>
              <Input
                value={formData.continent}
                onChange={(e) => setFormData({ ...formData, continent: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

