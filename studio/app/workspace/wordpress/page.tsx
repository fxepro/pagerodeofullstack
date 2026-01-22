"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Globe, 
  Search, 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Eye
} from 'lucide-react';

interface WordPressSite {
  id: number;
  site_url: string;
  site_name: string;
  plugin_version: string;
  last_sync: string;
  status: 'active' | 'inactive' | 'error';
  total_pages: number;
  total_posts: number;
  performance_score: number;
  seo_score: number;
  security_score: number;
  last_audit: string | null;
  sync_enabled: boolean;
}

export default function WordPressPage() {
  const [sites, setSites] = useState<WordPressSite[]>([
    {
      id: 1,
      site_url: 'example.com',
      site_name: 'Example Blog',
      plugin_version: '1.2.3',
      last_sync: '2024-01-15T10:30:00Z',
      status: 'active',
      total_pages: 45,
      total_posts: 234,
      performance_score: 87,
      seo_score: 92,
      security_score: 95,
      last_audit: '2024-01-15T09:00:00Z',
      sync_enabled: true,
    },
    {
      id: 2,
      site_url: 'demo-site.org',
      site_name: 'Demo Site',
      plugin_version: '1.2.1',
      last_sync: '2024-01-14T15:45:00Z',
      status: 'active',
      total_pages: 12,
      total_posts: 89,
      performance_score: 76,
      seo_score: 84,
      security_score: 88,
      last_audit: '2024-01-14T14:00:00Z',
      sync_enabled: true,
    },
    {
      id: 3,
      site_url: 'test-website.net',
      site_name: 'Test Website',
      plugin_version: '1.1.9',
      last_sync: '2024-01-13T08:20:00Z',
      status: 'inactive',
      total_pages: 8,
      total_posts: 45,
      performance_score: 65,
      seo_score: 71,
      security_score: 82,
      last_audit: '2024-01-12T10:00:00Z',
      sync_enabled: false,
    },
    {
      id: 4,
      site_url: 'myblog.com',
      site_name: 'My Personal Blog',
      plugin_version: '1.2.3',
      last_sync: '2024-01-15T11:00:00Z',
      status: 'active',
      total_pages: 23,
      total_posts: 156,
      performance_score: 91,
      seo_score: 88,
      security_score: 93,
      last_audit: '2024-01-15T10:30:00Z',
      sync_enabled: true,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const filteredSites = sites.filter(site => {
    const matchesSearch = 
      site.site_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.site_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && site.status === 'active') ||
      (statusFilter === 'inactive' && site.status === 'inactive') ||
      (statusFilter === 'error' && site.status === 'error');
    
    return matchesSearch && matchesStatus;
  });

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Calculate stats
  const totalSites = sites.length;
  const activeSites = sites.filter(s => s.status === 'active').length;
  const avgPerformance = Math.round(
    sites.reduce((sum, s) => sum + s.performance_score, 0) / sites.length
  );
  const avgSeo = Math.round(
    sites.reduce((sum, s) => sum + s.seo_score, 0) / sites.length
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h4-dynamic font-bold">WordPress Sites</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage WordPress sites with PageRodeo plugin installed</p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-h2-dynamic font-bold text-slate-800">{totalSites}</div>
              <p className="text-sm text-slate-600 mt-1">Total Sites</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-h2-dynamic font-bold text-green-600">{activeSites}</div>
              <p className="text-sm text-slate-600 mt-1">Active Sites</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-h2-dynamic font-bold text-blue-600">{avgPerformance}</div>
              <p className="text-sm text-slate-600 mt-1">Avg Performance</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-h2-dynamic font-bold text-purple-600">{avgSeo}</div>
              <p className="text-sm text-slate-600 mt-1">Avg SEO Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search sites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sites Table */}
      <Card>
        <CardHeader>
          <CardTitle>WordPress Sites</CardTitle>
          <CardDescription>
            {filteredSites.length} {filteredSites.length === 1 ? 'site' : 'sites'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSites.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <Globe className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <p className="text-h4-dynamic font-medium text-slate-700 mb-2">No sites found</p>
              <p className="text-sm">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plugin Version</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>SEO</TableHead>
                  <TableHead>Security</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSites.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell>
                      <div>
                        <a
                          href={`https://${site.site_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-palette-primary hover:underline flex items-center gap-1"
                        >
                          {site.site_name}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <p className="text-xs text-slate-500 mt-1">{site.site_url}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(site.status)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{site.plugin_version}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600">{site.total_pages} pages</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600">{site.total_posts} posts</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${getScoreColor(site.performance_score)}`}>
                          {site.performance_score}
                        </span>
                        <TrendingUp className="h-4 w-4 text-slate-400" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${getScoreColor(site.seo_score)}`}>
                          {site.seo_score}
                        </span>
                        <Activity className="h-4 w-4 text-slate-400" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${getScoreColor(site.security_score)}`}>
                          {site.security_score}
                        </span>
                        {site.security_score >= 90 ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600">
                        <div>{getTimeAgo(site.last_sync)}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {formatDate(site.last_sync)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

