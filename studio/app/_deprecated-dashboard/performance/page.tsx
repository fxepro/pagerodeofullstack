"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Gauge, TrendingUp, Clock, Zap, RefreshCw, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

interface PerformanceHistoryData {
  date: string;
  performanceScore: number;
  lcp: number;
  fid: number;
  cls: number;
  loadTime: number;
}

export default function PerformancePage() {
  const [urls, setUrls] = useState<string[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<string>('');
  const [historyData, setHistoryData] = useState<PerformanceHistoryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUrls, setLoadingUrls] = useState(false);
  
  // Date range state - default to 1 month ending today
  const today = new Date();
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(today.getMonth() - 1);
  
  const [endDate, setEndDate] = useState<string>(today.toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState<string>(oneMonthAgo.toISOString().split('T')[0]);

  // Fetch unique URLs on mount
  useEffect(() => {
    fetchUrls();
  }, []);

  // Fetch history data when URL or dates change
  useEffect(() => {
    if (selectedUrl) {
      fetchHistory(selectedUrl, startDate, endDate);
    } else {
      setHistoryData([]);
    }
  }, [selectedUrl, startDate, endDate]);

  const fetchUrls = async () => {
    setLoadingUrls(true);
    try {
      const response = await fetch(`${API_BASE}/api/analysis/performance/urls/`);
      if (response.ok) {
        const data = await response.json();
        setUrls(data.urls || []);
        if (data.urls && data.urls.length > 0) {
          setSelectedUrl(data.urls[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching URLs:', error);
    } finally {
      setLoadingUrls(false);
    }
  };

  const fetchHistory = async (url: string, start: string, end: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        url: url,
        start_date: start,
        end_date: end,
      });
      const response = await fetch(`${API_BASE}/api/analysis/performance/history/?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data.data || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error fetching history:', errorData);
        setHistoryData([]);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    
    // Calculate start date (1 month before end date)
    const end = new Date(newEndDate);
    const start = new Date(end);
    start.setMonth(end.getMonth() - 1);
    setStartDate(start.toISOString().split('T')[0]);
  };

  // Calculate current metrics from latest data
  const latestData = historyData.length > 0 ? historyData[historyData.length - 1] : null;
  const performanceScore = latestData?.performanceScore || 0;
  const loadTime = latestData?.loadTime || 0;
  const lcp = latestData?.lcp || 0;
  const fid = latestData?.fid || 0;
  const cls = latestData?.cls || 0;
  const totalRequests = 0; // This would need to come from the API if available

  // Format date range for display
  const formatDateRange = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  return (
    <div className="space-y-6">
      {/* 4 Metric Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Performance Score</p>
                <p className="text-3xl font-bold text-slate-800">
                  {performanceScore > 0 ? Math.round(performanceScore) : '--'}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Gauge className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Load Time</p>
                <p className="text-3xl font-bold text-slate-800">
                  {loadTime > 0 ? `${loadTime.toFixed(1)}s` : '--'}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Core Web Vitals</p>
                <p className="text-3xl font-bold text-slate-800">
                  {lcp > 0 || fid > 0 || cls > 0 ? 'Good' : '--'}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Requests</p>
                <p className="text-3xl font-bold text-slate-800">{totalRequests || '--'}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Range and URL selection - aligned to the left */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-slate-500" />
          <Input
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            className="w-40"
            max={today.toISOString().split('T')[0]}
          />
        </div>
        <div className="w-full max-w-xs">
          <Select value={selectedUrl} onValueChange={setSelectedUrl} disabled={loadingUrls}>
            <SelectTrigger>
              <SelectValue placeholder="Select a website">
                {loadingUrls ? 'Loading...' : selectedUrl || 'Select a website'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {urls.map((url) => (
                <SelectItem key={url} value={url}>
                  {url}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Performance Score Graph - Full Width */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Performance Score</CardTitle>
          <CardDescription>Performance score trends over the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-palette-primary" />
            </div>
          ) : historyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="date" 
                  stroke="#666"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#666"
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="performanceScore" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Performance Score"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-slate-500">
              {selectedUrl ? 'No data available for the selected website and date range' : 'Please select a website'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Core Web Vitals - 3 graphs in a row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LCP */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">LCP (Last Contentful Paint)</CardTitle>
            <CardDescription>Target: &lt; 2.5s</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-palette-primary" />
              </div>
            ) : historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#666"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#666" tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="lcp" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="LCP (s)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">No data</div>
            )}
          </CardContent>
        </Card>

        {/* FID */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">FID (First Input Delay)</CardTitle>
            <CardDescription>Target: &lt; 100ms</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-palette-primary" />
              </div>
            ) : historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#666"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#666" tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="fid" 
                    stroke="#ec4899" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="FID (ms)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">No data</div>
            )}
          </CardContent>
        </Card>

        {/* CLS */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">CLS (Cumulative Layout Shift)</CardTitle>
            <CardDescription>Target: &lt; 0.1</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-palette-primary" />
              </div>
            ) : historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#666"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#666" tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cls" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="CLS"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Load Time Graph - Full Width */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Load Time</CardTitle>
          <CardDescription>Page load time trends over the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-palette-primary" />
            </div>
          ) : historyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="date" 
                  stroke="#666"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#666"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="loadTime" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Load Time (s)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-slate-500">
              {selectedUrl ? 'No data available for the selected website and date range' : 'Please select a website'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
