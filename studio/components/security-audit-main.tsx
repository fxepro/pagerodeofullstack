"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSecurityAuditOrchestrator, CATEGORY_NAMES } from "@/hooks/use-security-audit-orchestrator";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Zap,
  Trash2,
  Activity,
  Eye,
  Download,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function SecurityAuditMain() {
  const { toast } = useToast();
  const orchestrator = useSecurityAuditOrchestrator();
  const [url, setUrl] = useState(orchestrator.state.target_url || "");
  const [activeTab, setActiveTab] = useState("overview");

  const handleStartAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a website URL to audit",
        variant: "destructive",
      });
      return;
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      await orchestrator.startAudit(normalizedUrl);
      toast({
        title: "Security Audit Started",
        description: "Comprehensive security analysis is now running. Results will appear as scans complete.",
      });
      setActiveTab("overview");
    } catch (error: any) {
      toast({
        title: "Error Starting Audit",
        description: error.message || "Failed to start security audit",
        variant: "destructive",
      });
    }
  };

  const getSecurityScore = () => {
    const { critical_findings, high_findings, medium_findings, low_findings, total_findings } = orchestrator.state;
    if (total_findings === 0) return 100;
    
    // Calculate score: 100 - (critical*20 + high*10 + medium*5 + low*2)
    const score = Math.max(0, 100 - (critical_findings * 20 + high_findings * 10 + medium_findings * 5 + low_findings * 2));
    return Math.round(score);
  };

  const getRiskLevel = () => {
    const score = getSecurityScore();
    if (score >= 80) return { level: 'Low', color: 'bg-green-600' };
    if (score >= 60) return { level: 'Medium', color: 'bg-yellow-600' };
    if (score >= 40) return { level: 'High', color: 'bg-orange-600' };
    return { level: 'Critical', color: 'bg-red-600' };
  };

  const renderOverviewTab = () => {
    const { state } = orchestrator;
    const score = getSecurityScore();
    const risk = getRiskLevel();
    const categories = Object.keys(state.scans_by_category);

    return (
      <div className="space-y-6">
        {/* Security Score Card */}
        <Card>
          <CardHeader>
            <CardTitle>Security Overview</CardTitle>
            <CardDescription>Comprehensive security assessment results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2" style={{ color: `var(--palette-primary)` }}>
                  {score}
                </div>
                <div className="text-sm text-muted-foreground">Security Score</div>
                <Badge className={`mt-2 ${risk.color}`}>{risk.level} Risk</Badge>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2 text-red-600">
                  {state.critical_findings + state.high_findings}
                </div>
                <div className="text-sm text-muted-foreground">Critical & High Findings</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {state.total_findings} total findings
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2 text-green-600">
                  {state.completed_scans}/{state.total_scans}
                </div>
                <div className="text-sm text-muted-foreground">Scans Completed</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {state.failed_scans} failed
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Findings by Severity */}
        <Card>
          <CardHeader>
            <CardTitle>Findings by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-2xl font-bold text-red-700">{state.critical_findings}</div>
                <div className="text-sm text-red-600">Critical</div>
              </div>
              <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="text-2xl font-bold text-orange-700">{state.high_findings}</div>
                <div className="text-sm text-orange-600">High</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">{state.medium_findings}</div>
                <div className="text-sm text-yellow-600">Medium</div>
              </div>
              <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{state.low_findings}</div>
                <div className="text-sm text-blue-600">Low</div>
              </div>
              <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-gray-700">{state.total_findings - state.critical_findings - state.high_findings - state.medium_findings - state.low_findings}</div>
                <div className="text-sm text-gray-600">Info</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scan Progress */}
        {state.isRunning && (
          <Card>
            <CardHeader>
              <CardTitle>Scan Progress</CardTitle>
              <CardDescription>Security scans in progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.map((category) => {
                  const scans = state.scans_by_category[category] || [];
                  const categoryName = CATEGORY_NAMES[category] || category;
                  const completed = scans.filter(s => s.state === 'completed').length;
                  const total = scans.length;

                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{categoryName}</span>
                        <span className="text-xs text-muted-foreground">
                          {completed}/{total} completed
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-palette-primary h-2 rounded-full transition-all"
                          style={{ width: `${(completed / total) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        {state.status === 'completed' && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button variant="outline" onClick={orchestrator.clearResults}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Results
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderCategoryTab = (category: string) => {
    const { state } = orchestrator;
    const scans = state.scans_by_category[category] || [];
    const categoryName = CATEGORY_NAMES[category] || category;
    const findings = state.findings_by_category?.[category] || [];

    if (scans.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          No scans in this category
        </div>
      );
    }

    const severityColors: Record<string, string> = {
      critical: 'bg-red-600 text-white',
      high: 'bg-orange-600 text-white',
      medium: 'bg-yellow-600 text-white',
      low: 'bg-blue-600 text-white',
      informational: 'bg-gray-600 text-white',
    };

    return (
      <div className="space-y-6">
        {/* Scan Status Cards */}
        <div className="space-y-4">
          {scans.map((scan) => {
            const isCompleted = scan.state === 'completed';
            const isRunning = scan.state === 'running';
            const isFailed = scan.state === 'failed';

            return (
              <Card key={scan.scan_type} className={isFailed ? 'border-red-500' : isCompleted ? 'border-green-500' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {categoryName} Analysis
                    </CardTitle>
                    <Badge
                      variant={isCompleted ? 'default' : isFailed ? 'destructive' : 'outline'}
                      className={isCompleted ? 'bg-green-600' : isFailed ? 'bg-red-600' : ''}
                    >
                      {isRunning && <Clock className="h-3 w-3 mr-1 animate-spin" />}
                      {isCompleted && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {isFailed && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {scan.state}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {isRunning && (
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-palette-primary h-2 rounded-full transition-all"
                          style={{ width: `${scan.progress}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">Analysis in progress...</p>
                    </div>
                  )}
                  {isCompleted && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Security Findings</span>
                        <Badge variant="outline">{scan.findings_count}</Badge>
                      </div>
                      {scan.duration && (
                        <p className="text-xs text-muted-foreground">
                          Completed in {Math.round(scan.duration / 1000)}s
                        </p>
                      )}
                    </div>
                  )}
                  {isFailed && (
                    <div className="text-sm text-red-600">
                      {scan.error || 'Analysis failed'}
                    </div>
                  )}
                  {scan.state === 'pending' && (
                    <p className="text-sm text-muted-foreground">Waiting to start...</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Findings List */}
        {findings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Security Findings</CardTitle>
              <CardDescription>
                {findings.length} finding{findings.length !== 1 ? 's' : ''} identified in {categoryName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {findings.map((finding: any, index: number) => (
                  <div
                    key={finding.id || index}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={severityColors[finding.severity] || 'bg-gray-600'}>
                          {finding.severity?.toUpperCase()}
                        </Badge>
                        <h4 className="font-semibold">{finding.title}</h4>
                      </div>
                      {finding.cvss_score && (
                        <Badge variant="outline">CVSS: {finding.cvss_score}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{finding.description}</p>
                    {finding.affected_url && (
                      <p className="text-xs text-muted-foreground mb-2">
                        <strong>Affected URL:</strong> {finding.affected_url}
                      </p>
                    )}
                    {finding.remediation && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-xs font-medium text-blue-900 mb-1">Remediation:</p>
                        <p className="text-xs text-blue-800">{finding.remediation}</p>
                      </div>
                    )}
                    {finding.cve_id && (
                      <p className="text-xs text-muted-foreground mt-2">
                        <strong>CVE:</strong> {finding.cve_id}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {findings.length === 0 && scans.some(s => s.state === 'completed') && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-semibold mb-2">No Security Issues Found</h3>
                <p className="text-muted-foreground">
                  This category analysis completed with no security findings.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-h4-dynamic font-bold">Security Audit</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive security analysis through automated tool orchestration. Enter a URL to generate a complete security map.
        </p>
      </div>

      {/* URL Entry Bar */}
      <div className="mb-6 bg-gradient-to-r from-palette-primary to-palette-primary-hover rounded-2xl p-6 shadow-lg">
        <form onSubmit={handleStartAudit} className="flex flex-col gap-4">
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
              disabled={orchestrator.state.isRunning}
              className="px-8 h-14 bg-white text-palette-primary hover:bg-white/90 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center rounded-xl"
            >
              {orchestrator.state.isRunning ? (
                <>
                  <Clock className="h-5 w-5 mr-2 animate-spin" />
                  Auditing...
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5 mr-2" />
                  Run Security Audit
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Results Tabs */}
      {orchestrator.state.target_url && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Security Audit Results</CardTitle>
                <CardDescription>
                  {orchestrator.state.target_url}
                  {orchestrator.state.isRunning && (
                    <span className="ml-2 text-orange-600">• Running</span>
                  )}
                  {orchestrator.state.status === 'completed' && (
                    <span className="ml-2 text-green-600">• Completed</span>
                  )}
                </CardDescription>
              </div>
              {!orchestrator.state.isRunning && orchestrator.state.status === 'completed' && (
                <Button variant="outline" onClick={orchestrator.clearResults}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                {Object.keys(orchestrator.state.scans_by_category).map((category) => {
                  const categoryName = CATEGORY_NAMES[category] || category;
                  const scans = orchestrator.state.scans_by_category[category] || [];
                  const completed = scans.filter(s => s.state === 'completed').length;
                  
                  return (
                    <TabsTrigger 
                      key={category} 
                      value={category}
                      disabled={completed === 0 && !orchestrator.state.isRunning}
                    >
                      {categoryName}
                      {completed > 0 && (
                        <Badge variant="outline" className="ml-2">
                          {completed}
                        </Badge>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <TabsContent value="overview">
                {renderOverviewTab()}
              </TabsContent>

              {Object.keys(orchestrator.state.scans_by_category).map((category) => (
                <TabsContent key={category} value={category}>
                  {renderCategoryTab(category)}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!orchestrator.state.target_url && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Start a Security Audit</h3>
              <p className="text-muted-foreground mb-4">
                Enter a website URL above to begin comprehensive security analysis
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

