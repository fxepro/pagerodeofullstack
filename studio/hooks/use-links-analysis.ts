"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import { useErrorHandler } from "./use-error-handler";

export interface LinkResult {
  url: string;
  status: number;
  statusText: string;
  responseTime: number;
  error?: string;
  isInternal: boolean;
  linkText?: string;
}

export interface UseLinksAnalysisOptions {
  initialUrl?: string;
  autoRun?: boolean;
}

export function useLinksAnalysis(options: UseLinksAnalysisOptions = {}) {
  const { initialUrl = "", autoRun = false } = options;

  const [domain, setDomain] = useState<string>(initialUrl);
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<LinkResult[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [discoveredLinks, setDiscoveredLinks] = useState<string[]>([]);
  
  // Track checked domains to prevent infinite loops
  const checkedDomains = useRef<Set<string>>(new Set());
  
  // Error handler integration
  const {
    error,
    isRetrying,
    clearError,
    executeWithErrorHandling
  } = useErrorHandler();

  const cleanedDomain = useMemo(() => {
    if (!domain.trim()) return "";
    let clean = domain.trim();
    clean = clean.replace(/^https?:\/\//, "");
    clean = clean.replace(/^www\./, "");
    clean = clean.replace(/\/.*$/, "");
    return clean.toLowerCase();
  }, [domain]);

  const runLinkCheck = useCallback(async () => {
    const testDomain = cleanedDomain;

    if (!testDomain) {
      toast.error("Please enter a domain");
      return;
    }

    // Prevent infinite retry
    if (checkedDomains.current.has(testDomain)) {
      return;
    }

    setLoading(true);
    setResults([]);
    setDiscoveredLinks([]);
    setStatusMessage("🔍 Discovering links and checking status...");
    clearError();

    try {
      // Mark domain as checked BEFORE making request
      checkedDomains.current.add(testDomain);
      
      const data = await executeWithErrorHandling(
        async () => {
          const response = await fetch('/api/links', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: testDomain }),
          });

          // Attach HTTP status to error
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error: any = new Error(errorData.error || `HTTP ${response.status}`);
            error.response = { status: response.status };
            throw error;
          }

          const result = await response.json();
          return result;
        },
        'Links Analysis',
        testDomain
      );

      setDiscoveredLinks(data.links || []);
      setResults(data.results || []);

      if (data.results && data.results.length > 0) {
        const passed = data.results.filter((r: LinkResult) => r.status >= 200 && r.status < 400).length;
        const broken = data.results.filter((r: LinkResult) => r.status >= 400 || r.status === 0).length;
        const external = data.results.filter((r: LinkResult) => !r.isInternal).length;
        const internal = data.results.filter((r: LinkResult) => r.isInternal).length;
        setStatusMessage(`✅ Link check complete! ${passed} working, ${broken} broken. ${internal} internal, ${external} external.`);
      } else {
        setStatusMessage(data.message || "❌ No links found to check");
      }
    } catch (error) {
      // Error already handled by error handler
      setStatusMessage(`❌ Link check failed`);
    } finally {
      setLoading(false);
    }
  }, [cleanedDomain, executeWithErrorHandling, clearError]);

  const clearResults = useCallback(() => {
    setResults([]);
    setDiscoveredLinks([]);
    setStatusMessage("");
    clearError();
  }, [clearError]);

  // Optional auto-run for dashboard usage
  useEffect(() => {
    if (!autoRun) return;
    if (!initialUrl) return;
    if (results.length > 0 || loading) return;
    // Don't retry if domain was already checked
    if (checkedDomains.current.has(cleanedDomain)) return;
    const t = setTimeout(() => { runLinkCheck(); }, 100);
    return () => clearTimeout(t);
  }, [autoRun, initialUrl, results.length, loading, cleanedDomain, runLinkCheck]);

  return {
    domain,
    setDomain,
    loading,
    results,
    statusMessage,
    discoveredLinks,
    runLinkCheck,
    clearResults,
    setStatusMessage,
    error,
    isRetrying,
    clearError,
  };
}


