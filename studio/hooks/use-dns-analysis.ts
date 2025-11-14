"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import { useErrorHandler } from "./use-error-handler";

export interface DNSData {
  domain: string;
  timestamp: string;
  dns: {
    ipv4: string[];
    ipv6: string[];
    mx: string[];
    txt: string[];
    ns: string[];
    soa: {
      nsname: string;
      hostmaster: string;
      serial: number;
      refresh: number;
      retry: number;
      expire: number;
      minttl: number;
    } | null;
    cname: string[];
    srv: {
      name: string;
      port: number;
      priority: number;
      weight: number;
      target: string;
    }[];
  };
}

export interface UseDnsAnalysisOptions {
  initialUrl?: string;
  autoRun?: boolean;
}

export function useDnsAnalysis(options: UseDnsAnalysisOptions = {}) {
  const { initialUrl = "", autoRun = false } = options;

  const [domain, setDomain] = useState<string>(initialUrl);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [dnsData, setDnsData] = useState<DNSData | null>(null);
  const [showAllTxt, setShowAllTxt] = useState<boolean>(false);
  
  // Track checked domains to prevent infinite retries (Option A)
  const checkedDomains = useRef<Set<string>>(new Set());
  
  const {
    error,
    isRetrying,
    retryState,
    clearError,
    executeWithErrorHandling
  } = useErrorHandler();

  const cleanDomain = useMemo(() => {
    if (!domain.trim()) return "";
    let clean = domain.trim();
    clean = clean.replace(/^https?:\/\//, '');
    clean = clean.replace(/^www\./, '');
    clean = clean.replace(/\/.*$/, '');
    return clean.toLowerCase();
  }, [domain]);

  const handleCheck = useCallback(async () => {
    if (!cleanDomain) {
      toast.error("Domain Required: Please enter a domain to check");
      return;
    }
    
    // Prevent infinite retry: if already checked this domain, skip
    if (checkedDomains.current.has(cleanDomain)) {
      return;
    }
    
    setIsChecking(true);
    setDnsData(null);
    setShowAllTxt(false);
    clearError();
    
    try {
      // Mark domain as checked BEFORE making the request
      checkedDomains.current.add(cleanDomain);
      
      const data = await executeWithErrorHandling(
        async () => {
          const response = await fetch('/api/dns', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ domain: cleanDomain }) 
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error: any = new Error(errorData.error || 'DNS check failed');
            error.response = { status: response.status };
            throw error;
          }
          
          const result = await response.json();
          
          // Check for DNS_NOT_FOUND error code (same as SSL API)
          if (result.code === 'DNS_NOT_FOUND') {
            throw new Error(result.message || "Domain cannot be resolved. Please check the domain name and try again.");
          }
          
          // Check if DNS lookup failed (all records empty could indicate DNS failure)
          const hasAnyRecords = result.dns?.ipv4?.length > 0 || 
                                result.dns?.ipv6?.length > 0 || 
                                result.dns?.mx?.length > 0 ||
                                result.dns?.ns?.length > 0;
          
          if (!hasAnyRecords && result.dns) {
            throw new Error("Domain cannot be resolved. Please check the domain name and try again.");
          }
          
          return result;
        },
        'DNS Analysis',
        cleanDomain
      );
      
      setDnsData(data);
      const totalRecords = data.dns.ipv4.length + data.dns.ipv6.length + data.dns.mx.length + data.dns.txt.length + data.dns.ns.length + (data.dns.soa ? 1 : 0) + data.dns.cname.length + data.dns.srv.length;
      toast.success(`Found ${totalRecords} DNS records`);
    } catch (err) {
      // Error already handled by error handler - no need to log
      // Domain is already marked as checked, so won't retry
    } finally {
      setIsChecking(false);
    }
  }, [cleanDomain, executeWithErrorHandling, clearError]);

  useEffect(() => {
    if (!autoRun) return;
    if (!initialUrl) return;
    if (dnsData || isChecking) return;
    // Don't retry if domain was already checked (even if it failed)
    if (checkedDomains.current.has(cleanDomain)) return;
    const t = setTimeout(() => { handleCheck(); }, 100);
    return () => clearTimeout(t);
  }, [autoRun, initialUrl, dnsData, isChecking, cleanDomain, handleCheck]);

  return {
    domain,
    setDomain,
    isChecking,
    dnsData,
    showAllTxt,
    setShowAllTxt,
    handleCheck,
    error,
    isRetrying,
    retryState,
    clearError,
  };
}


