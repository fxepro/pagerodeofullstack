"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import { useErrorHandler } from "./use-error-handler";

export interface SslData {
  domain: string;
  ssl: {
    valid: boolean;
    issuer: string;
    validFrom: string;
    validTo: string;
    daysUntilExpiry: number;
    protocol: string;
    cipher: string;
    keySize: number;
    subject?: string;
    serialNumber?: string;
    fingerprint?: string;
    altNames?: string[];
  };
  dns: {
    ipv4: string[];
    ipv6: string[];
    mx: string[];
    txt: string[];
    ns: string[];
  };
  domain_info: {
    registrar: string;
    created: string;
    expires: string;
    daysUntilExpiry: number;
    status: string[];
  };
  security: {
    hsts: boolean;
    redirectsToHttps: boolean;
    mixedContent: boolean;
    securityHeaders: string[];
  };
}

export interface UseSslAnalysisOptions {
  initialUrl?: string;
  autoRun?: boolean;
}

export function useSslAnalysis(options: UseSslAnalysisOptions = {}) {
  const { initialUrl = "", autoRun = false } = options;

  const [url, setUrl] = useState<string>(initialUrl);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [sslData, setSslData] = useState<SslData | null>(null);
  
  // Track checked domains to prevent infinite retries (Option A)
  const checkedDomains = useRef<Set<string>>(new Set());
  
  // Error handler integration
  const {
    error,
    isRetrying,
    clearError,
    executeWithErrorHandling
  } = useErrorHandler();

  const cleanedDomain = useMemo(() => {
    if (!url.trim()) return "";
    let domain = url.trim();
    domain = domain.replace(/^https?:\/\//, '');
    domain = domain.replace(/^www\./, '');
    domain = domain.replace(/\/.*$/, '');
    return domain.toLowerCase();
  }, [url]);

  const handleCheck = useCallback(async () => {
    if (!cleanedDomain) {
      toast.error("Please enter a domain: Enter a domain or URL to check SSL and DNS information");
      return;
    }
    
    // Prevent infinite retry: if already checked this domain, skip
    if (checkedDomains.current.has(cleanedDomain)) {
      return;
    }
    
    setIsChecking(true);
    setSslData(null);
    clearError();
    
    try {
      // Mark domain as checked BEFORE making the request
      checkedDomains.current.add(cleanedDomain);
      
      const data = await executeWithErrorHandling(
        async () => {
          const response = await fetch("/api/ssl", { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ domain: cleanedDomain }) 
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error: any = new Error(errorData.error || "Failed to check SSL");
            error.response = { status: response.status };
            throw error;
          }
          
          const result = await response.json();
          
          // Check for DNS_NOT_FOUND error code
          if (result.code === 'DNS_NOT_FOUND') {
            throw new Error(result.message || "Domain cannot be resolved");
          }
          
          return result;
        },
        'SSL Analysis',
        cleanedDomain
      );
      
      setSslData(data);
      toast.success("SSL analyzed successfully");
    } catch (err: any) {
      // Error already handled by error handler - no need to log
    } finally {
      setIsChecking(false);
    }
  }, [cleanedDomain, executeWithErrorHandling, clearError]);

  useEffect(() => {
    if (!autoRun) return;
    if (!initialUrl) return;
    if (sslData || isChecking) return;
    // Don't retry if domain was already checked (even if it failed)
    if (checkedDomains.current.has(cleanedDomain)) return;
    const t = setTimeout(() => { handleCheck(); }, 100);
    return () => clearTimeout(t);
  }, [autoRun, initialUrl, sslData, isChecking, cleanedDomain, handleCheck]);

  return {
    url,
    setUrl,
    isChecking,
    sslData,
    handleCheck,
    error,
    isRetrying,
    clearError,
  };
}


