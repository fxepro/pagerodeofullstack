"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { 
  FileText,
  Activity,
  AlertTriangle,
  BarChart3,
  ExternalLink,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
  Package,
  Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Removed EmailVerificationBanner banner

interface AuditReport {
  id: string;
  url: string;
  audit_data?: {
    successful?: string[];
    failed?: string[];
    totalDuration?: number;
  };
  created_at: string;
}

interface MonitoredSite {
  id: string;
  url: string;
  status: 'up' | 'down' | 'checking';
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalAudits: 0,
    monitoredSites: 0,
    reportsWithErrors: 0,
    uniqueSites: 0
  });
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [monitoredSites, setMonitoredSites] = useState<MonitoredSite[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    setError(null);

    // Define API_BASE at function scope so it's available throughout
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

    try {
      const token = localStorage.getItem('access_token');
      
      // Fetch audit reports
      let reportsData: AuditReport[] = [];
      if (token) {
        try {
          const reportsResponse = await fetch(`${API_BASE}/api/reports/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (reportsResponse.ok) {
            reportsData = await reportsResponse.json();
            setReports(reportsData);
          }
        } catch (err) {
          console.error('Error fetching reports:', err);
        }
      }

      // Fetch monitored sites from backend API
      let sitesData: MonitoredSite[] = [];
      if (token) {
        try {
          const sitesResponse = await fetch(`${API_BASE}/api/monitor/sites/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (sitesResponse.ok) {
            const apiSites = await sitesResponse.json();
            // Map API response to MonitoredSite interface
            sitesData = apiSites.map((site: any) => ({
              id: site.id.toString(),
              url: site.url,
              status: site.status || 'checking'
            }));
            setMonitoredSites(sitesData);
          }
        } catch (err) {
          console.error('Error fetching monitored sites:', err);
        }
      }

      // Calculate stats
      const totalAudits = reportsData.length;
      const reportsWithErrors = reportsData.filter(r => (r.audit_data?.failed?.length || 0) > 0).length;
      const uniqueSites = [...new Set(reportsData.map(r => r.url))].length;
      
      setStats({
        totalAudits,
        monitoredSites: sitesData.length,
        reportsWithErrors,
        uniqueSites
      });

      // Build alerts from failed reports and down sites
      const alertsList: any[] = [];
      
      // Add failed audit reports
      reportsData
        .filter(r => (r.audit_data?.failed?.length || 0) > 0)
        .slice(0, 5)
        .forEach(report => {
          alertsList.push({
            type: 'audit_failure',
            title: `${t('dashboard.auditFailedFor')} ${report.url}`,
            description: `${report.audit_data?.failed?.length || 0} ${t('dashboard.toolsFailed')}`,
            timestamp: report.created_at,
            url: report.url
          });
        });

      // Add down monitored sites
      sitesData
        .filter(s => s.status === 'down')
        .forEach(site => {
          alertsList.push({
            type: 'site_down',
            title: `${site.url} ${t('dashboard.siteIsDown')}`,
            description: t('dashboard.websiteOffline'),
            timestamp: new Date().toISOString(),
            url: site.url
          });
        });

      // Sort by timestamp (most recent first)
      alertsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAlerts(alertsList.slice(0, 10)); // Keep top 10

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || t('dashboard.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }

  // Get recent activity (last 5 audit reports)
  const recentActivity = reports
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-palette-primary" />
        <span className="ml-2 text-slate-600">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4 Stat Containers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{t('dashboard.reports')}</p>
                <p className="text-3xl font-bold text-slate-800">{stats.totalAudits}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{t('monitoring.title')}</p>
                <p className="text-3xl font-bold text-slate-800">{stats.monitoredSites}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{t('monitoring.alerts')}</p>
                <p className="text-3xl font-bold text-orange-600">{stats.reportsWithErrors}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{t('monitoring.siteName')}</p>
                <p className="text-3xl font-bold text-purple-600">{stats.uniqueSites}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            {t('monitoring.alerts')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-600">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p>{t('monitoring.noSites')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-red-800">{alert.title}</p>
                    <p className="text-sm text-red-600">{alert.description}</p>
                    <p className="text-xs text-red-500 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {alert.url && (
                    <a
                      href={`https://${alert.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 hover:text-red-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.quickActions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/site-audit">
              <div className="bg-gradient-to-r from-palette-primary to-palette-primary-hover text-white rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{t('dashboard.siteAudit')}</h3>
                    <p className="text-sm text-white/90">{t('dashboard.siteAuditDesc')}</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/monitoring">
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Activity className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{t('monitoring.title')}</h3>
                    <p className="text-sm text-white/90">{t('dashboard.monitoringDesc')}</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/reports">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{t('dashboard.reports')}</h3>
                    <p className="text-sm text-white/90">{t('dashboard.reportsDesc')}</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.comingSoon')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer opacity-75">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{t('dashboard.wordpressIntegration')}</h3>
                  <p className="text-sm text-white/90">{t('dashboard.connectWordpress')}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer opacity-75">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Search className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{t('dashboard.seoMonitoring')}</h3>
                  <p className="text-sm text-white/90">{t('dashboard.trackRankings')}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-600" />
            {t('dashboard.recentActivity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-slate-600">
              <FileText className="h-12 w-12 mx-auto mb-3 text-slate-400" />
              <p>{t('dashboard.noRecentActivity')}</p>
              <p className="text-sm mt-1">{t('dashboard.runAudit')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((report) => {
                const successCount = report.audit_data?.successful?.length || 0;
                const failedCount = report.audit_data?.failed?.length || 0;
                
                return (
                  <div key={report.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      failedCount > 0 ? 'bg-red-500' : successCount > 0 ? 'bg-green-500' : 'bg-slate-400'
                    }`}></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {t('dashboard.auditCompleted')}{' '}
                            <a
                              href={`https://${report.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-palette-primary hover:underline"
                            >
                              {report.url}
                            </a>
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {successCount > 0 && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {successCount} {t('dashboard.successful')}
                              </Badge>
                            )}
                            {failedCount > 0 && (
                              <Badge className="bg-red-100 text-red-800">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {failedCount} {t('dashboard.failed')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(report.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}