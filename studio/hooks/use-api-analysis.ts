"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import { useErrorHandler } from "./use-error-handler";

export interface TestResult {
  endpoint: string;
  status: number | null;
  latency: number | null;
  pass: boolean;
  body?: any;
  error?: string;
}

export interface UseApiAnalysisOptions {
  initialUrl?: string;
  autoRun?: boolean;
}

export function useApiAnalysis(options: UseApiAnalysisOptions = {}) {
  const { initialUrl = "", autoRun = false } = options;

  const [domain, setDomain] = useState<string>(initialUrl);
  const [customEndpoints, setCustomEndpoints] = useState<string>("");
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [discovered, setDiscovered] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>("");
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
  
  // Reset hasRun when URL changes
  useEffect(() => {
    setHasRun(false);
    setResults([]);
    setDiscovered([]);
    setStatusMessage("");
  }, [initialUrl]);

  const cleanDomain = useMemo(() => {
    if (!domain) return "";
    let cleaned = domain.replace(/^https?:\/\//, '');
    cleaned = cleaned.replace(/^www\./, '');
    cleaned = cleaned.replace(/\/$/, '');
    return `https://${cleaned}`;
  }, [domain]);

  const crawlForApiEndpoints = useCallback(async (base: string) => {
    try {
      setStatusMessage("🔍 Crawling website for API links...");
      const res = await fetch(base, { 
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; API-Discovery-Bot/1.0)' }
      });
      if (!res.ok) {
        setStatusMessage("❌ Failed to crawl website");
        return [] as string[];
      }
      setStatusMessage("📄 Parsing HTML for API endpoints...");
      const html = await res.text();
      const hrefMatches = [...html.matchAll(/href=["']([^"']*\/api\/[^"']*)["']/gi)];
      const apiLinks = hrefMatches.map(m => {
        let url = m[1];
        if (url.startsWith('/')) {
          url = base.replace(/\/$/, "") + url;
        } else if (!url.startsWith('http')) {
          url = base.replace(/\/$/, "") + '/' + url;
        }
        return url;
      }).filter(url => url.includes('/api/'));
      const unique = [...new Set(apiLinks)];
      setStatusMessage(unique.length > 0 ? `✅ Found ${unique.length} API endpoints from crawling` : "⚠️ No API endpoints found in website links");
      return unique;
    } catch (error: any) {
      console.warn('Crawling failed:', error);
      setStatusMessage("❌ Crawling failed: " + error.message);
      return [] as string[];
    }
  }, []);

  const discoverEndpoints = useCallback(async (base: string) => {
    const manualList = customEndpoints.split(",").map(ep => ep.trim()).filter(Boolean);
    if (manualList.length > 0) {
      setStatusMessage(`📝 Using ${manualList.length} custom endpoints`);
      const customUrls = manualList.map(ep => ep.startsWith('http') ? ep : (ep.startsWith('/') ? base.replace(/\/$/, "") + ep : base.replace(/\/$/, "") + '/' + ep));
      setStatusMessage(`✅ Found ${customUrls.length} custom endpoints to test`);
      return customUrls;
    }

    try {
      setStatusMessage("🗺️ Checking sitemap.xml...");
      const sitemapUrl = base.replace(/\/$/, "") + "/sitemap.xml";
      const res = await fetch(sitemapUrl);
      if (res.ok) {
        setStatusMessage("📋 Parsing sitemap for API endpoints...");
        const xml = await res.text();
        const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
        const apiLinks = matches.filter(u => u.includes("/api/"));
        if (apiLinks.length > 0) {
          setStatusMessage(`✅ Found ${apiLinks.length} API endpoints in sitemap`);
          return apiLinks;
        }
      }
      setStatusMessage("⚠️ No sitemap.xml or no /api/ endpoints, trying crawling...");
    } catch {
      setStatusMessage("⚠️ Sitemap failed, trying crawling...");
    }

    const crawled = await crawlForApiEndpoints(base);
    if (crawled.length > 0) return crawled;

    setStatusMessage("🔍 Trying common API endpoint patterns...");
    const patterns = ["/api", "/api/", "/api/v1", "/api/v2", "/api/users", "/api/posts", "/api/data", "/api/health", "/api/status", "/api/info", "/api/docs", "/api/swagger", "/posts", "/users", "/data", "/health", "/status"];
    const testUrls = patterns.map(p => base.replace(/\/$/, "") + p);
    const valid: string[] = [];
    for (let i = 0; i < testUrls.length; i++) {
      const url = testUrls[i];
      setStatusMessage(`🔍 Testing pattern ${i + 1}/${testUrls.length}: ${url}`);
      try {
        const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
        if (res.status === 200 || res.status === 401 || res.status === 403) valid.push(url);
      } catch {}
    }
    if (valid.length > 0) {
      setStatusMessage(`✅ Found ${valid.length} real API endpoints using pattern matching`);
      return valid;
    }
    setStatusMessage("❌ No API endpoints found via any discovery method");
    return [] as string[];
  }, [crawlForApiEndpoints, customEndpoints]);

  const runTests = useCallback(async () => {
    if (!domain.trim()) {
      toast({ title: "Domain Required", description: "Please enter a domain to test API endpoints.", variant: "destructive" });
      return;
    }
    
    // Prevent infinite retry
    if (checkedDomains.current.has(cleanDomain)) {
      return;
    }
    
    setLoading(true);
    setResults([]);
    setDiscovered([]);
    setStatusMessage("🚀 Starting API discovery...");
    setHasRun(true);
    clearError();

    try {
      // Mark domain as checked BEFORE making request
      checkedDomains.current.add(cleanDomain);
      
      await executeWithErrorHandling(
        async () => {
          const endpoints = await discoverEndpoints(cleanDomain);
          setDiscovered(endpoints);
          if (endpoints.length === 0) {
            setStatusMessage("❌ No endpoints found to test");
            toast({ title: "No API Endpoints Found", description: "No /api/ endpoints found. Add custom endpoints to test specific APIs.", variant: "destructive" });
            return;
          }

          setStatusMessage(`🧪 Testing ${endpoints.length} endpoints...`);
          const out: TestResult[] = [];
          for (let i = 0; i < endpoints.length; i++) {
            const url = endpoints[i];
            setStatusMessage(`🧪 Testing endpoint ${i + 1}/${endpoints.length}: ${url}`);
            const start = performance.now();
            try {
              const res = await fetch(url, { signal: AbortSignal.timeout(10000), method: 'GET', headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; API-Test-Bot/1.0)' } });
              const latency = performance.now() - start;
              const body = await res.json().catch(() => null);
              out.push({ endpoint: url, status: res.status, latency, pass: res.ok, body });
            } catch (err: any) {
              out.push({ endpoint: url, status: null, latency: null, pass: false, error: err.message });
            }
          }
          setResults(out);
          const passedCount = out.filter(r => r.pass).length;
          const authRequiredCount = out.filter(r => !r.pass && (r.status === 401 || r.status === 403)).length;
          const failedCount = out.filter(r => !r.pass && r.status !== 401 && r.status !== 403).length;
          setStatusMessage(authRequiredCount > 0 ? `✅ Testing complete! ${passedCount} passed, ${authRequiredCount} require auth, ${failedCount} failed` : `✅ Testing complete! ${passedCount}/${endpoints.length} endpoints passed`);
          toast({ title: "API Testing Complete", description: `${passedCount}/${out.length} endpoints passed the test.` });
        },
        'API Analysis',
        cleanDomain
      );
    } catch (error: any) {
      // Error already handled by error handler
      setStatusMessage("❌ Testing failed");
    } finally {
      setLoading(false);
    }
  }, [discoverEndpoints, cleanDomain, domain, executeWithErrorHandling, clearError]);

  useEffect(() => {
    if (!autoRun) return;
    if (!initialUrl) return;
    if (hasRun || loading) return;
    // Don't retry if domain was already checked
    if (checkedDomains.current.has(cleanDomain)) return;
    const t = setTimeout(() => { runTests(); }, 100);
    return () => clearTimeout(t);
  }, [autoRun, initialUrl, hasRun, loading, cleanDomain, runTests]);

  const clearAll = useCallback(() => {
    setResults([]);
    setDiscovered([]);
    setStatusMessage("");
    setDomain("");
    setCustomEndpoints("");
  }, []);

  return {
    domain,
    setDomain,
    customEndpoints,
    setCustomEndpoints,
    results,
    loading,
    discovered,
    statusMessage,
    runTests,
    clearAll,
    error,
    isRetrying,
    clearError,
  };
}


