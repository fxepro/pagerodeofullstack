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

  // Comprehensive API endpoint discovery
  const discoverEndpoints = useCallback(async (base: string) => {
    const manualList = customEndpoints.split(",").map(ep => ep.trim()).filter(Boolean);
    if (manualList.length > 0) {
      setStatusMessage(`📝 Using ${manualList.length} custom endpoints`);
      const customUrls = manualList.map(ep => ep.startsWith('http') ? ep : (ep.startsWith('/') ? base.replace(/\/$/, "") + ep : base.replace(/\/$/, "") + '/' + ep));
      setStatusMessage(`✅ Found ${customUrls.length} custom endpoints to test`);
      return customUrls;
    }

    const discoveredEndpoints = new Set<string>();

    // 1. Check OpenAPI/Swagger schema
    try {
      setStatusMessage("📚 Checking for OpenAPI/Swagger schema...");
      const schemaUrls = [
        "/api/schema/",
        "/api/schema/swagger/",
        "/api/swagger.json",
        "/api/openapi.json",
        "/swagger.json",
        "/openapi.json",
        "/api/docs/swagger.json"
      ];
      for (const path of schemaUrls) {
        try {
          const url = base.replace(/\/$/, "") + path;
          const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
          if (res.ok) {
            const schema = await res.json();
            if (schema.paths) {
              const paths = Object.keys(schema.paths);
              paths.forEach(p => {
                if (p.startsWith('/api/')) {
                  discoveredEndpoints.add(base.replace(/\/$/, "") + p);
                }
              });
              if (discoveredEndpoints.size > 0) {
                setStatusMessage(`✅ Found ${discoveredEndpoints.size} endpoints from OpenAPI schema`);
                return Array.from(discoveredEndpoints);
              }
            }
          }
        } catch {}
      }
    } catch {}

    // 2. Check sitemap.xml
    try {
      setStatusMessage("🗺️ Checking sitemap.xml...");
      const sitemapUrl = base.replace(/\/$/, "") + "/sitemap.xml";
      const res = await fetch(sitemapUrl, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        setStatusMessage("📋 Parsing sitemap for API endpoints...");
        const xml = await res.text();
        const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
        matches.forEach(u => {
          if (u.includes("/api/")) discoveredEndpoints.add(u);
        });
        if (discoveredEndpoints.size > 0) {
          setStatusMessage(`✅ Found ${discoveredEndpoints.size} API endpoints in sitemap`);
          return Array.from(discoveredEndpoints);
        }
      }
    } catch {}

    // 3. Check robots.txt for hints
    try {
      setStatusMessage("🤖 Checking robots.txt...");
      const robotsUrl = base.replace(/\/$/, "") + "/robots.txt";
      const res = await fetch(robotsUrl, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const text = await res.text();
        const lines = text.split('\n').filter(l => l.includes('/api/'));
        lines.forEach(line => {
          const match = line.match(/\/api\/[^\s]+/);
          if (match) {
            const path = match[0];
            discoveredEndpoints.add(base.replace(/\/$/, "") + path);
          }
        });
      }
    } catch {}

    // 4. Crawl HTML for API links
    const crawled = await crawlForApiEndpoints(base);
    crawled.forEach(ep => discoveredEndpoints.add(ep));

    // 5. Comprehensive pattern discovery
    setStatusMessage("🔍 Discovering API endpoints using comprehensive patterns...");
    const commonApiPaths = [
      // Base API paths
      "/api", "/api/", "/api/v1", "/api/v2", "/api/v3",
      // Common REST resources
      "/api/users", "/api/posts", "/api/data", "/api/auth", "/api/login", "/api/logout",
      "/api/register", "/api/token", "/api/refresh", "/api/verify", "/api/reset",
      // Health & status
      "/api/health", "/api/status", "/api/ping", "/api/info", "/api/version",
      // Documentation
      "/api/docs", "/api/swagger", "/api/redoc", "/api/schema",
      // Common features
      "/api/analyze", "/api/monitor", "/api/dns", "/api/ssl", "/api/links",
      "/api/sitemap", "/api/typography", "/api/ai-analyze", "/api/ai-question",
      "/api/ai-health", "/api/test-errors", "/api/site-config",
      // Monitor sub-paths
      "/api/monitor/sites", "/api/monitor/links", "/api/monitor/uptime",
      "/api/monitor/uptime-kuma",
      // Typography sub-paths
      "/api/typography/presets", "/api/typography/active",
      // AI Health sub-paths
      "/api/ai-health/status", "/api/ai-health/metrics",
      // Audit
      "/api/audit-reports",
      // Other common patterns
      "/api/search", "/api/query", "/api/filter", "/api/sort",
      "/api/export", "/api/import", "/api/upload", "/api/download"
    ];

    // Test each pattern
    const valid: string[] = [];
    for (let i = 0; i < commonApiPaths.length; i++) {
      const path = commonApiPaths[i];
      const url = base.replace(/\/$/, "") + path;
      setStatusMessage(`🔍 Testing pattern ${i + 1}/${commonApiPaths.length}: ${path}`);
      try {
        const res = await fetch(url, { 
          method: 'HEAD', 
          signal: AbortSignal.timeout(3000),
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; API-Discovery-Bot/1.0)' }
        });
        // Accept 200, 401, 403, 405 (Method Not Allowed means endpoint exists)
        if (res.status === 200 || res.status === 401 || res.status === 403 || res.status === 405) {
          valid.push(url);
          discoveredEndpoints.add(url);
        }
      } catch {}
    }

    // 6. Recursive discovery: check discovered endpoints for more endpoints
    if (discoveredEndpoints.size > 0) {
      setStatusMessage(`🔄 Recursively discovering from ${discoveredEndpoints.size} found endpoints...`);
      const endpointsArray = Array.from(discoveredEndpoints);
      for (const endpoint of endpointsArray.slice(0, 10)) { // Limit to first 10 to avoid infinite loops
        try {
          const res = await fetch(endpoint, { 
            signal: AbortSignal.timeout(5000),
            headers: { 'Accept': 'application/json' }
          });
          if (res.ok) {
            const body = await res.text();
            // Look for API links in JSON responses
            const jsonMatches = [...body.matchAll(/["']([^"']*\/api\/[^"']*)["']/g)];
            jsonMatches.forEach(m => {
              let url = m[1];
              if (url.startsWith('/')) {
                url = base.replace(/\/$/, "") + url;
              } else if (!url.startsWith('http')) {
                url = base.replace(/\/$/, "") + '/' + url;
              }
              if (url.includes('/api/')) discoveredEndpoints.add(url);
            });
          }
        } catch {}
      }
    }

    const finalEndpoints = Array.from(discoveredEndpoints);
    if (finalEndpoints.length > 0) {
      setStatusMessage(`✅ Discovered ${finalEndpoints.length} API endpoints using comprehensive discovery`);
      return finalEndpoints;
    }

    setStatusMessage("❌ No API endpoints found via any discovery method");
    return [] as string[];
  }, [crawlForApiEndpoints, customEndpoints]);

  const runTests = useCallback(async () => {
    if (!domain.trim()) {
      toast.error("Domain Required: Please enter a domain to test API endpoints.");
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
            toast.error("No API Endpoints Found: No /api/ endpoints found. Add custom endpoints to test specific APIs.");
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
          toast.success(`API Testing Complete: ${passedCount}/${out.length} endpoints passed the test.`);
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
    setStatusMessage,
    runTests,
    clearAll,
    error,
    isRetrying,
    clearError,
  };
}


