"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { applyTheme } from "@/lib/theme";
import axios from "axios";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Server,
  Database,
  Zap,
} from "lucide-react";

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000')

interface SystemStatus {
  status: string;
  monitoring: {
    running_jobs: number;
    failed_jobs_24h: number;
    theme_degraded: boolean;
    log_files: Record<string, {
      exists: boolean;
      size_mb: number;
    }>;
  };
  jobs: {
    running: Array<{
      job_id: string;
      job_type: string;
      start_time: number;
    }>;
    failed_recent: Array<{
      job_id: string;
      job_type: string;
      error: string;
      duration: number;
    }>;
  };
}

interface LogFile {
  type: string;
  filename: string;
  size_bytes: number;
  size_mb: number;
  exists: boolean;
}

interface LogData {
  log_type: string;
  log_file: string;
  total_lines: number;
  returned_lines: number;
  lines: string[];
}

export default function AdminMonitoringPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [selectedLogType, setSelectedLogType] = useState<string>("app");
  const [logData, setLogData] = useState<LogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [logLoading, setLogLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemStatus();
    fetchLogFiles();
  }, []);

  useEffect(() => {
    if (selectedLogType) {
      fetchLogs(selectedLogType);
    }
  }, [selectedLogType]);

  const fetchSystemStatus = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setError("Authentication token not found. Please log in.");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE}/api/monitoring/status/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSystemStatus(response.data);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setError("Admin access required. Please log in with an admin account.");
      } else {
        setError(error.response?.data?.error || "Failed to fetch system status");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLogFiles = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const response = await axios.get(`${API_BASE}/api/monitoring/logs/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLogFiles(response.data.log_files || []);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setError("Admin access required. Please log in with an admin account.");
      }
      console.error("Error fetching log files:", error);
    }
  };

  const fetchLogs = async (logType: string, lines: number = 100) => {
    setLogLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const response = await axios.get(
        `${API_BASE}/api/monitoring/logs/${logType}/?lines=${lines}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setLogData(response.data);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setError("Admin access required. Please log in with an admin account.");
      } else {
        setError(error.response?.data?.error || "Failed to fetch logs");
      }
      console.error("Error fetching logs:", error);
    } finally {
      setLogLoading(false);
    }
  };

  const refreshData = () => {
    setLoading(true);
    fetchSystemStatus();
    fetchLogFiles();
    if (selectedLogType) {
      fetchLogs(selectedLogType);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-slate-600" />
          <p className="mt-4 text-slate-600">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  if (error && !systemStatus) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={applyTheme.page()}>
      {/* System Status Cards */}
      {systemStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Running Jobs</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {systemStatus.monitoring.running_jobs}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Failed Jobs (24h)</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {systemStatus.monitoring.failed_jobs_24h}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">System Status</p>
                  <p className="text-2xl font-bold text-slate-800 capitalize">
                    {systemStatus.status}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Theme Status</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {systemStatus.monitoring.theme_degraded ? "Degraded" : "Healthy"}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    systemStatus.monitoring.theme_degraded ? "bg-yellow-600" : "bg-green-600"
                  }`}
                >
                  <Zap className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Jobs and Logs Tabs */}
      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Running Jobs</TabsTrigger>
          <TabsTrigger value="failed">Failed Jobs</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-800">Running Jobs</CardTitle>
              <CardDescription>Currently executing background jobs</CardDescription>
            </CardHeader>
            <CardContent>
              {systemStatus?.jobs.running.length === 0 ? (
                <p className="text-slate-600 text-center py-8">No running jobs</p>
              ) : (
                <div className="space-y-4">
                  {systemStatus?.jobs.running.map((job) => (
                    <div
                      key={job.job_id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div>
                        <p className="font-medium text-slate-800">{job.job_type}</p>
                        <p className="text-sm text-slate-600">Job ID: {job.job_id}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        Running
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-800">Failed Jobs (Last 24 Hours)</CardTitle>
              <CardDescription>Recently failed background jobs</CardDescription>
            </CardHeader>
            <CardContent>
              {systemStatus?.jobs.failed_recent.length === 0 ? (
                <p className="text-slate-600 text-center py-8">No failed jobs in the last 24 hours</p>
              ) : (
                <div className="space-y-4">
                  {systemStatus?.jobs.failed_recent.map((job) => (
                    <div
                      key={job.job_id}
                      className="p-4 bg-red-50 rounded-lg border border-red-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-red-800">{job.job_type}</p>
                          <p className="text-sm text-red-600">Job ID: {job.job_id}</p>
                        </div>
                        <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>
                      </div>
                      <p className="text-sm text-red-700 mt-2">{job.error}</p>
                      {job.duration && (
                        <p className="text-xs text-red-600 mt-1">
                          Duration: {job.duration.toFixed(2)}s
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-800">Log Files</CardTitle>
              <CardDescription>View and monitor application logs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Log File Selector */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-slate-600">Log Type:</label>
                <select
                  value={selectedLogType}
                  onChange={(e) => setSelectedLogType(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {logFiles.map((file) => (
                    <option key={file.type} value={file.type}>
                      {file.filename} ({file.exists ? `${file.size_mb} MB` : "Not found"})
                    </option>
                  ))}
                </select>
                <Button
                  onClick={() => fetchLogs(selectedLogType, 100)}
                  variant="outline"
                  size="sm"
                  disabled={logLoading}
                >
                  {logLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Log Data Display */}
              {logData && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Showing {logData.returned_lines} of {logData.total_lines} lines</span>
                    <span>File: {logData.log_file}</span>
                  </div>
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
                    {logData.lines.map((line, index) => (
                      <div key={index} className="whitespace-pre-wrap">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!logData && !logLoading && (
                <p className="text-slate-600 text-center py-8">Select a log type to view logs</p>
              )}

              {logLoading && (
                <div className="text-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-slate-600" />
                  <p className="text-slate-600 mt-2">Loading logs...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
