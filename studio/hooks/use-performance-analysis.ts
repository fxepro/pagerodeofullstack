"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import { useErrorHandler } from "./use-error-handler";

export interface AnalysisData {
  url: string;
  loadTime: number;
  pageSize: number;
  requests: number;
  performanceScore: number;
  coreWebVitals: { lcp: number; fid: number; cls: number };
  recommendations: string[];
  timestamp: string;
  lighthouseResults?: { accessibility: number; bestPractices: number; seo: number };
}

export interface UsePerformanceAnalysisOptions {
  initialUrl?: string;
  autoRun?: boolean;
}

export function usePerformanceAnalysis(options: UsePerformanceAnalysisOptions = {}) {
  const { initialUrl = "", autoRun = false } = options;

  const [url, setUrl] = useState<string>(initialUrl);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasRun, setHasRun] = useState<boolean>(false);
  
  // Track checked domains to prevent infinite loops
  const checkedDomains = useRef<Set<string>>(new Set());
  
  // Error handler integration
  const {
    error,
    isRetrying,
    clearError,
    executeWithErrorHandling
  } = useErrorHandler();

  const cleanedUrl = useMemo(() => url, [url]);

  const analyzeWebsite = useCallback(async () => {
    if (!cleanedUrl) {
      toast.error("URL Required: Please enter a URL to analyze");
      return;
    }
    
    // Prevent infinite retry
    if (checkedDomains.current.has(cleanedUrl)) {
      return;
    }
    
    setLoading(true);
    setData(null);
    clearError();
    
    try {
      // Mark domain as checked BEFORE making request
      checkedDomains.current.add(cleanedUrl);
      setHasRun(true);
      
      const analysisData = await executeWithErrorHandling(
        async () => {
          const response = await fetch("/api/analyze", { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ url: cleanedUrl }) 
          });
          
          // Attach HTTP status to error
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error: any = new Error(errorData.error || "Analysis failed");
            error.response = { status: response.status };
            throw error;
          }
          
          const result = await response.json();
          return result;
        },
        'Performance Analysis',
        cleanedUrl
      );
      
      setData(analysisData);
      toast.success("Performance analyzed successfully");
    } catch (err: any) {
      // Error already handled by error handler
    } finally {
      setLoading(false);
    }
  }, [cleanedUrl, executeWithErrorHandling, clearError]);

  const downloadReport = useCallback((data: AnalysisData) => {
    const report = {
      title: `Performance Report - ${data.url}`,
      timestamp: data.timestamp,
      summary: { url: data.url, performanceScore: data.performanceScore, loadTime: `${data.loadTime.toFixed(2)}s`, pageSize: `${data.pageSize.toFixed(2)} MB`, requests: data.requests },
      coreWebVitals: { lcp: `${data.coreWebVitals.lcp.toFixed(2)}s`, fid: `${data.coreWebVitals.fid.toFixed(0)}ms`, cls: data.coreWebVitals.cls.toFixed(3) },
      lighthouseResults: data.lighthouseResults ? { accessibility: data.lighthouseResults.accessibility, bestPractices: data.lighthouseResults.bestPractices, seo: data.lighthouseResults.seo } : null,
      recommendations: data.recommendations,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const urlObj = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlObj;
    a.download = `pagerodeo-report-${data.url.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(urlObj);
    toast.success("Performance report has been downloaded");
  }, []);

  const shareResults = useCallback(async (data: AnalysisData) => {
    const summary = `🚀 Performance Report for ${data.url}\n\n📊 Overall Score: ${data.performanceScore}/100\n⚡ Load Time: ${data.loadTime.toFixed(2)}s\n📦 Page Size: ${data.pageSize.toFixed(2)} MB\n🔗 Requests: ${data.requests}\n\n🎯 Core Web Vitals:\n• LCP: ${data.coreWebVitals.lcp.toFixed(2)}s\n• FID: ${data.coreWebVitals.fid.toFixed(0)}ms\n• CLS: ${data.coreWebVitals.cls.toFixed(3)}\n`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Performance Report - ${data.url}`, text: summary, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(summary);
        toast.success("Performance summary copied to clipboard");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(summary);
        toast.success("Performance summary copied to clipboard");
      } catch {
        toast.error("Failed to share results. Please copy manually.");
      }
    }
  }, []);

  useEffect(() => {
    if (!autoRun) return;
    if (!initialUrl) return;
    if (hasRun || loading) return;
    // Don't retry if domain was already checked
    if (checkedDomains.current.has(cleanedUrl)) return;
    const t = setTimeout(() => { analyzeWebsite(); }, 100);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, initialUrl, hasRun, loading, cleanedUrl]);

  return {
    url,
    setUrl,
    data,
    loading,
    error,
    isRetrying,
    clearError,
    analyzeWebsite,
    downloadReport,
    shareResults,
  };
}


