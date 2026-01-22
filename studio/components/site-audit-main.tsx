"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAnalysisOrchestrator } from "@/hooks/use-analysis-orchestrator-v2";
import { 
  Search, 
  Gauge, 
  Monitor, 
  Shield, 
  FileText, 
  Link2, 
  Code,
  Type,
  CheckCircle,
  Clock,
  Download,
  Zap,
  Activity,
  Server,
  Network,
  Link,
  Loader2,
  XCircle,
  Trash2,
  StopCircle
} from "lucide-react";
import { triggerBackgroundSave } from "@/lib/save-audit-to-db";

import { getApiBaseUrl } from '@/lib/api-config';

// Import existing components to reuse
import PerformanceMain from "@/components/performance-main";
import PerformanceDashboard from "@/components/performance-dashboard";
import { MonitorMain } from "@/components/monitor-main";
import MonitorDashboard from "@/components/monitor-dashboard";
import { SslMain } from "@/components/ssl-main";
import SslDashboard from "@/components/ssl-dashboard";
import { DnsMain } from "@/components/dns-main";
import DnsDashboard from "@/components/dns-dashboard";
import SitemapMain from "@/components/sitemap-main";
import SitemapDashboard from "@/components/sitemap-dashboard";
import { ApiMain } from "@/components/api-main";
import ApiDashboard from "@/components/api-dashboard";
import { LinksMain } from "@/components/links-main";
import LinksDashboard from "@/components/links-dashboard";
import { TypographyMain } from "@/components/typography-main";
import TypographyDashboard from "@/components/typography-dashboard";

const LAST_SAVED_RUN_KEY = 'pagerodeo_last_saved_run';

const getInitialLastSavedRunId = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(LAST_SAVED_RUN_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed.runId === 'number') {
      return parsed.runId as number;
    }
  } catch (error) {
    console.warn('Failed to load last saved run id:', error);
  }
  return null;
};

interface ServiceStatus {
  loading: boolean;
  completed: boolean;
  error: boolean;
  data: any;
}

export function SiteAuditMain() {
  const { toast } = useToast();
  const orchestrator = useAnalysisOrchestrator();
  const [url, setUrl] = useState(orchestrator.state.url || "");
  const [selectedServices, setSelectedServices] = useState<string[]>(["performance", "monitor", "ssl", "dns", "sitemap", "links", "typography"]);
  const [activeTab, setActiveTab] = useState<string>("");
  const auditReportIdRef = useRef<string | null>(null);

  const services = [
    {
      id: "performance",
      name: "Performance",
      icon: Zap,
      color: "bg-blue-500",
      description: "Website speed and optimization"
    },
    {
      id: "monitor",
      name: "Monitor",
      icon: Activity,
      color: "bg-green-500",
      description: "Uptime and health monitoring"
    },
    {
      id: "ssl",
      name: "SSL",
      icon: Shield,
      color: "bg-palette-accent-1",
      description: "Certificate security analysis"
    },
    {
      id: "dns",
      name: "DNS",
      icon: Server,
      color: "bg-orange-500",
      description: "DNS configuration analysis"
    },
    {
      id: "sitemap",
      name: "Sitemap",
      icon: Network,
      color: "bg-indigo-500",
      description: "Sitemap structure analysis"
    },
    {
      id: "api",
      name: "API",
      icon: Code,
      color: "bg-red-500",
      description: "API endpoint monitoring"
    },
    {
      id: "links",
      name: "Links",
      icon: Link,
      color: "bg-teal-500",
      description: "Broken link detection"
    },
    {
      id: "typography",
      name: "Typography",
      icon: Type,
      color: "bg-yellow-500",
      description: "Font and typography analysis"
    }
  ];

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const lastSavedRunRef = useRef<number | null>(getInitialLastSavedRunId());
  
  useEffect(() => {
    const run = async () => {
      // Debug logging
      console.log('[SiteAudit] useEffect triggered:', {
        lastCompletedRunId: orchestrator.state.lastCompletedRunId,
        isRunning: orchestrator.state.isRunning,
        endTime: orchestrator.state.endTime,
        url: orchestrator.state.url,
        lastSavedRun: lastSavedRunRef.current,
        hasAnalyses: !!orchestrator.state.analyses
      });
      
      const completedRunId = orchestrator.state.lastCompletedRunId;
      if (!completedRunId) {
        console.log('[SiteAudit] No completedRunId, skipping save');
        return;
      }
      if (lastSavedRunRef.current === completedRunId) {
        console.log('[SiteAudit] Already saved this runId, skipping');
        return;
      }
      if (orchestrator.state.isRunning) {
        console.log('[SiteAudit] Still running, skipping save');
        return;
      }
      if (!orchestrator.state.url) {
        console.log('[SiteAudit] No URL, skipping save');
        return;
      }

      const analyses = orchestrator.state.analyses;
      const successfulTools = Object.entries(analyses)
        .filter(([_, analysis]) => analysis.state === 'success')
        .map(([type]) => type);
      const failedTools = Object.entries(analyses)
        .filter(([_, analysis]) => analysis.state === 'error')
        .map(([type]) => type);

      if (successfulTools.length === 0 && failedTools.length === 0) {
        console.log('[SiteAudit] No successful or failed tools, skipping save');
        return;
      }
      
      console.log('[SiteAudit] Conditions met, proceeding with save:', {
        successfulTools,
        failedTools,
        completedRunId
      });

      // Note: Backend supports anonymous saves (AllowAny permission)
      // Token is optional - will save as anonymous if not provided
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('No auth token - will save as anonymous');
      }

      try {
        console.log('Saving audit record:', {
          url: orchestrator.state.url,
          successful: successfulTools,
          failed: failedTools,
          runId: completedRunId
        });

        const fullUrl = orchestrator.state.url.startsWith('http')
          ? orchestrator.state.url
          : `https://${orchestrator.state.url}`;

        // Trigger background save - runs async, doesn't block UI
        // User can view from localStorage while data saves to database
        triggerBackgroundSave();
        
        console.log('✅ [SiteAudit] Analysis complete. Results stored in orchestrator state. Background save triggered.');
        
        // Store completion info in localStorage for reference
        lastSavedRunRef.current = completedRunId;
        try {
          localStorage.setItem(LAST_SAVED_RUN_KEY, JSON.stringify({ runId: completedRunId, timestamp: Date.now() }));
        } catch (error) {
          console.warn('Failed to persist last saved run id:', error);
        }
      } catch (error) {
        console.error('Failed to save audit record:', error);
      }
    };

    run();
  }, [
    orchestrator.state.isRunning, 
    orchestrator.state.endTime, 
    orchestrator.state.url, 
    orchestrator.state.lastCompletedRunId, 
    orchestrator.state.analyses, 
    selectedServices
  ]);
  
  // Also trigger save immediately when endTime changes and isRunning becomes false
  // This is a backup trigger to ensure save happens even if the main useEffect doesn't fire
  useEffect(() => {
    if (!orchestrator.state.isRunning && 
        orchestrator.state.endTime && 
        orchestrator.state.lastCompletedRunId &&
        orchestrator.state.url &&
        lastSavedRunRef.current !== orchestrator.state.lastCompletedRunId) {
      console.log('[SiteAudit] Direct trigger: endTime set and not running, triggering save');
      triggerBackgroundSave();
      lastSavedRunRef.current = orchestrator.state.lastCompletedRunId;
    }
  }, [orchestrator.state.isRunning, orchestrator.state.endTime, orchestrator.state.lastCompletedRunId, orchestrator.state.url]);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    if (selectedServices.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one service to analyze",
        variant: "destructive",
      });
      return;
    }

    // Clean the URL
    let cleanUrl = url.trim()
    cleanUrl = cleanUrl.replace(/^https?:\/\//, '') // Remove http:// or https://
    cleanUrl = cleanUrl.replace(/^www\./, '') // Remove www.
    cleanUrl = cleanUrl.replace(/\/.*$/, '') // Remove everything after first /
    cleanUrl = cleanUrl.toLowerCase()

    // Validate URL format
    if (cleanUrl.length < 4) {
      toast({
        title: "Invalid URL",
        description: "Domain is too short. Please enter a valid domain (e.g., google.com)",
        variant: "destructive",
      });
      return;
    }

    if (!cleanUrl.includes('.')) {
      toast({
        title: "Invalid URL",
        description: "Domain must include a TLD (e.g., example.com, not just example)",
        variant: "destructive",
      });
      return;
    }

    // Check for invalid characters
    if (!/^[a-z0-9.-]+$/.test(cleanUrl)) {
      toast({
        title: "Invalid URL",
        description: "Domain contains invalid characters. Use only letters, numbers, dots, and hyphens.",
        variant: "destructive",
      });
      return;
    }

    // Check for valid TLD structure (at least 2 parts)
    const parts = cleanUrl.split('.');
    if (parts.length < 2 || parts.some(part => part.length === 0)) {
      toast({
        title: "Invalid URL",
        description: "Invalid domain format. Example: example.com or subdomain.example.com",
        variant: "destructive",
      });
      return;
    }

    // Set Results tab as active when analysis starts
    setActiveTab("results");
    
    // DECOUPLED: Site audit now runs independently
    // No longer creating AuditReport or saving to separate analysis apps
    // Results are stored in orchestrator state and localStorage only
    
    // Start sequential analysis via orchestrator (no database integration)
    console.log(`[SiteAudit] Starting independent analysis for: ${cleanUrl}`);
    orchestrator.startAnalysis(cleanUrl, selectedServices, null);
    
    toast({
      title: "Analysis Started",
      description: `Running ${selectedServices.length} analyses for ${cleanUrl}`,
    });
  };

  const getStatusIcon = (serviceId: string) => {
    // Don't show any status if no URL (landing state)
    if (!orchestrator.state.url) return null;
    
    const status = orchestrator.state.analyses[serviceId as keyof typeof orchestrator.state.analyses];
    if (!status) return null;
    
    if (status.state === 'running') {
      return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
    }
    if (status.state === 'success') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (status.state === 'error') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const renderTabContent = () => {
    if (!activeTab) return null;

    const service = services.find(s => s.id === activeTab);
    if (!service) return null;

    // Reuse existing components with the URL - pass url prop to auto-trigger analysis
    switch (activeTab) {
      case "performance":
        return <PerformanceDashboard key={url} url={url} />;
      case "monitor":
        return <MonitorDashboard key={url} url={url} />;
      case "ssl":
        return <SslDashboard key={url} url={url} />;
      case "dns":
        return <DnsDashboard key={url} url={url} />;
      case "sitemap":
        return <SitemapDashboard key={url} url={url} />;
      case "api":
        return <ApiDashboard key={url} url={url} />;
      case "links":
        return <LinksDashboard key={url} url={url} />;
      case "typography":
        return <TypographyDashboard key={url} url={url} />;
      default:
        return <div>Service not implemented yet</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-h1-dynamic font-bold">Site Audit</h1>
        <p className="text-muted-foreground mt-1">Comprehensive website analysis including performance, monitoring, SSL, DNS, sitemap, links, and typography</p>
      </div>

      {/* URL Entry Bar */}
      <div className="mb-6 bg-gradient-to-r from-palette-primary to-palette-primary-hover rounded-2xl p-6 shadow-lg">
        <form onSubmit={handleAnalyze} className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              id="url"
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 h-14 text-lg px-6 bg-white/90 border-0 rounded-xl placeholder:text-gray-500 focus:ring-2 focus:ring-white/50"
              disabled={orchestrator.state.isRunning}
            />
            <Button
              type="submit"
              disabled={orchestrator.state.isRunning || selectedServices.length === 0}
              className="px-8 h-14 bg-white text-palette-primary hover:bg-white/90 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center rounded-xl"
            >
              {orchestrator.state.isRunning ? (
                <>
                  <Clock className="h-5 w-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>
          
          {/* Tools in one line */}
          <div className="flex flex-wrap items-center gap-4">
            {services.map((service) => {
              const ServiceIcon = service.icon;
              const isSelected = selectedServices.includes(service.id);
              
              if (!ServiceIcon) return null;
              
              return (
                <label
                  key={service.id}
                  className="flex items-center gap-2 cursor-pointer text-white hover:text-white/80 transition-colors"
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleServiceToggle(service.id)}
                  />
                  <ServiceIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{service.name}</span>
                </label>
              );
            })}
          </div>
        </form>
      </div>

      {/* Tabbed Results */}
      {selectedServices.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Analysis Results</CardTitle>
              <div className="flex gap-2">
                {orchestrator.state.isRunning && (
                  <Button 
                    variant="outline"
                    onClick={() => orchestrator.stopAnalysis()}
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    <StopCircle className="h-4 w-4 mr-2" />
                    Stop Analysis
                  </Button>
                )}
                <Button 
                  variant="outline"
                  disabled={!orchestrator.state.url}
                  onClick={() => orchestrator.clearResults()}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Results
                </Button>
                {/* Download Report Button - Hidden for now, might need later
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!orchestrator.state.url || orchestrator.state.isRunning}
                  onClick={async () => {
                  try {
                    // Show all tabs before PDF export
                    selectedServices.forEach(serviceId => {
                      const divs = document.querySelectorAll(`#site-audit-report > div`);
                      divs.forEach((div, index) => {
                        const tabs = document.querySelectorAll(`#site-audit-report > div`);
                        if (tabs[index]) {
                          (tabs[index] as HTMLElement).style.display = 'block';
                        }
                      });
                    });
                    
                    // Wait a bit for display change
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    const filename = `site-audit-${url.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.pdf`;
                    await exportToPDF("site-audit-report", {
                      title: "Comprehensive Site Audit Report",
                      subtitle: url,
                      filename
                    });
                    
                    // Restore original visibility
                    selectedServices.forEach(serviceId => {
                      const divs = document.querySelectorAll(`#site-audit-report > div`);
                      divs.forEach((div, index) => {
                        if (index < selectedServices.length) {
                          (div as HTMLElement).style.display = selectedServices[index] === activeTab ? 'block' : 'none';
                        }
                      });
                    });
                    
                    toast({
                      title: "Success",
                      description: "Your PDF report has been downloaded successfully.",
                    });
                  } catch (error) {
                    console.error("PDF export error:", error);
                    toast({
                      title: "Error",
                      description: "Failed to generate PDF. Please try again.",
                      variant: "destructive"
                    });
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
              */}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-palette-accent-2 bg-palette-accent-3 p-2 rounded-lg">
              {/* Results Tab - Always First */}
              <button
                onClick={() => setActiveTab("results")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === "results"
                    ? 'bg-palette-accent-2 text-purple-800 border-2 border-palette-accent-2 shadow-sm'
                    : 'text-palette-primary hover:bg-palette-accent-3 border border-palette-accent-2'
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                <span>Results</span>
              </button>

              {/* Analysis Tabs */}
              {selectedServices.map((serviceId) => {
                const service = services.find(s => s.id === serviceId);
                const isActive = activeTab === serviceId;
                const isEnabled = orchestrator.isTabEnabled(serviceId as any);
                
                if (!service) return null;
                
                const TabIcon = service.icon;
                if (!TabIcon) return null;
                
                return (
                  <button
                    key={serviceId}
                    onClick={() => isEnabled && setActiveTab(serviceId)}
                    disabled={!isEnabled}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'bg-palette-accent-2 text-purple-800 border-2 border-palette-accent-2 shadow-sm'
                        : isEnabled
                        ? 'text-palette-primary hover:bg-palette-accent-3 border border-palette-accent-2'
                        : 'text-palette-accent-2 cursor-not-allowed border border-purple-100 opacity-50'
                    }`}
                  >
                    <TabIcon className="h-4 w-4" />
                    <span>{service.name}</span>
                    {getStatusIcon(serviceId)}
                  </button>
                );
              })}
            </div>

            {/* Tab Content - All tabs visible for PDF export */}
            <div id="site-audit-report" className="min-h-[400px]">
              {/* Results Tab Content */}
              {activeTab === "results" && (
                <div>
                  <h3 className="text-h3-dynamic font-bold mb-4 text-slate-800 border-b pb-2">Analysis Status</h3>
                  
                  {/* Compact Status List */}
                  <div className="bg-white rounded-lg border border-slate-200">
                    {selectedServices.map((serviceId, index) => {
                      const service = services.find(s => s.id === serviceId);
                      const status = orchestrator.state.analyses[serviceId as keyof typeof orchestrator.state.analyses];
                      if (!service) return null;

                      const ServiceIcon = service.icon;
                      const isLast = index === selectedServices.length - 1;
                      
                      return (
                        <div key={serviceId} className={`flex items-center justify-between p-3 hover:bg-slate-50 ${!isLast ? 'border-b border-slate-200' : ''}`}>
                          <div className="flex items-center gap-3 flex-1">
                            {ServiceIcon && <ServiceIcon className="h-4 w-4 text-slate-500" />}
                            <span className="font-medium text-slate-800">{service.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            {status.state === 'pending' && (
                              <>
                                <Clock className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-400">Waiting</span>
                              </>
                            )}
                            {status.state === 'running' && (
                              <>
                                <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />
                                <span className="text-yellow-600 font-medium">Analyzing...</span>
                              </>
                            )}
                            {status.state === 'success' && (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-green-600 font-medium">
                                  {status.duration ? `${(status.duration / 1000).toFixed(1)}s` : 'Done'}
                                </span>
                              </>
                            )}
                            {status.state === 'error' && (
                              <>
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span className="text-red-600 font-medium">Failed</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Summary Bar */}
                  {orchestrator.state.url && (
                    <div className="mt-4 p-3 bg-slate-100 rounded-lg flex items-center justify-between text-sm">
                      <span className="text-slate-700 font-medium">
                        Progress: {selectedServices.filter(serviceId => {
                          const status = orchestrator.state.analyses[serviceId as keyof typeof orchestrator.state.analyses];
                          return status.state === 'success' || status.state === 'error';
                        }).length} of {selectedServices.length}
                      </span>
                      <div className="flex items-center gap-3">
                        {selectedServices.filter(serviceId => {
                          const status = orchestrator.state.analyses[serviceId as keyof typeof orchestrator.state.analyses];
                          return status.state === 'success';
                        }).length > 0 && (
                          <span className="text-green-600 font-medium">
                            ✓ {selectedServices.filter(serviceId => {
                              const status = orchestrator.state.analyses[serviceId as keyof typeof orchestrator.state.analyses];
                              return status.state === 'success';
                            }).length} complete
                          </span>
                        )}
                        {selectedServices.filter(serviceId => {
                          const status = orchestrator.state.analyses[serviceId as keyof typeof orchestrator.state.analyses];
                          return status.state === 'error';
                        }).length > 0 && (
                          <span className="text-red-600 font-medium">
                            ✗ {selectedServices.filter(serviceId => {
                              const status = orchestrator.state.analyses[serviceId as keyof typeof orchestrator.state.analyses];
                              return status.state === 'error';
                            }).length} failed
                          </span>
                        )}
                        {orchestrator.state.isRunning && (
                          <span className="text-yellow-600 font-medium flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Running
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Render analysis results only if completed - key ensures fresh state per URL but not per tab switch */}
              {(orchestrator.state.analyses.performance.state === 'success' || orchestrator.state.analyses.performance.state === 'error') && selectedServices.includes("performance") && (
                <div key={`perf-${orchestrator.state.url}`} style={{ display: activeTab === "performance" ? "block" : "none" }}>
                  <h3 className="text-h3-dynamic font-bold mb-4 text-slate-800 border-b pb-2">Performance Analysis</h3>
                  <PerformanceDashboard url={orchestrator.state.url} />
                  <div className="h-4" />
                </div>
              )}
              {(orchestrator.state.analyses.monitor.state === 'success' || orchestrator.state.analyses.monitor.state === 'error') && selectedServices.includes("monitor") && (
                <div key={`mon-${orchestrator.state.url}`} style={{ display: activeTab === "monitor" ? "block" : "none" }}>
                  <h3 className="text-h3-dynamic font-bold mb-4 text-slate-800 border-b pb-2">Monitor Analysis</h3>
                  <MonitorDashboard url={orchestrator.state.url} />
                  <div className="h-4" />
                </div>
              )}
              {(orchestrator.state.analyses.ssl.state === 'success' || orchestrator.state.analyses.ssl.state === 'error') && selectedServices.includes("ssl") && (
                <div key={`ssl-${orchestrator.state.url}`} style={{ display: activeTab === "ssl" ? "block" : "none" }}>
                  <h3 className="text-h3-dynamic font-bold mb-4 text-slate-800 border-b pb-2">SSL Analysis</h3>
                  <SslDashboard url={orchestrator.state.url} />
                  <div className="h-4" />
                </div>
              )}
              {(orchestrator.state.analyses.dns.state === 'success' || orchestrator.state.analyses.dns.state === 'error') && selectedServices.includes("dns") && (
                <div key={`dns-${orchestrator.state.url}`} style={{ display: activeTab === "dns" ? "block" : "none" }}>
                  <h3 className="text-h3-dynamic font-bold mb-4 text-slate-800 border-b pb-2">DNS Analysis</h3>
                  <DnsDashboard url={orchestrator.state.url} />
                  <div className="h-4" />
                </div>
              )}
              {(orchestrator.state.analyses.sitemap.state === 'success' || orchestrator.state.analyses.sitemap.state === 'error') && selectedServices.includes("sitemap") && (
                <div key={`site-${orchestrator.state.url}`} style={{ display: activeTab === "sitemap" ? "block" : "none" }}>
                  <h3 className="text-h3-dynamic font-bold mb-4 text-slate-800 border-b pb-2">Sitemap Analysis</h3>
                  <SitemapDashboard url={orchestrator.state.url} />
                  <div className="h-4" />
                </div>
              )}
              {(orchestrator.state.analyses.api.state === 'success' || orchestrator.state.analyses.api.state === 'error') && selectedServices.includes("api") && (
                <div key={`api-${orchestrator.state.url}`} style={{ display: activeTab === "api" ? "block" : "none" }}>
                  <h3 className="text-h3-dynamic font-bold mb-4 text-slate-800 border-b pb-2">API Analysis</h3>
                  <ApiDashboard url={orchestrator.state.url} />
                  <div className="h-4" />
                </div>
              )}
              {(orchestrator.state.analyses.links.state === 'success' || orchestrator.state.analyses.links.state === 'error') && selectedServices.includes("links") && (
                <div key={`links-${orchestrator.state.url}`} style={{ display: activeTab === "links" ? "block" : "none" }}>
                  <h3 className="text-h3-dynamic font-bold mb-4 text-slate-800 border-b pb-2">Links Analysis</h3>
                  <LinksDashboard url={orchestrator.state.url} />
                  <div className="h-4" />
                </div>
              )}
              {(orchestrator.state.analyses.typography.state === 'success' || orchestrator.state.analyses.typography.state === 'error') && selectedServices.includes("typography") && (
                <div key={`typ-${orchestrator.state.url}`} style={{ display: activeTab === "typography" ? "block" : "none" }}>
                  <h3 className="text-h3-dynamic font-bold mb-4 text-slate-800 border-b pb-2">Typography Analysis</h3>
                  <TypographyDashboard url={orchestrator.state.url} />
                  <div className="h-4" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SiteAuditMain;