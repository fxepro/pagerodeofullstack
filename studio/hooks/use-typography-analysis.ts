"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import { useErrorHandler } from "./use-error-handler";

export interface TypographyElement {
  size: string;
  lineHeight: string;
  fontFamily: string;
  fontWeight: string;
  count: number;
}

export interface FontVariant {
  weight: number;
  style: 'normal' | 'italic';
  size: number;
  format: string;
  url?: string;
}

export interface FontFamily {
  family: string;
  source: 'google' | 'custom' | 'system';
  variants: FontVariant[];
  usedOn: string[];
  settings: {
    display: string;
    preload: boolean;
    fallback?: string;
  };
}

export interface TypographyData {
  domain: string;
  timestamp: string;
  summary: {
    totalFamilies: number;
    totalVariants: number;
    totalSize: number;
    googleFonts: number;
    customFonts: number;
    systemFonts: number;
    loadTime: number;
    overallScore: number;
  };
  fonts: FontFamily[];
  typography: {
    h1: TypographyElement;
    h2: TypographyElement;
    h3: TypographyElement;
    h4: TypographyElement;
    h5: TypographyElement;
    h6: TypographyElement;
    body: TypographyElement;
    small: TypographyElement;
  };
  performance: {
    totalSize: number;
    totalRequests: number;
    loadTime: number;
    renderBlocking: number;
    strategy: {
      display: string;
      preloaded: number;
      async: number;
    };
    score: number;
  };
  readability: {
    overallScore: number;
    breakdown: {
      fontSize: number;
      lineHeight: number;
      contrast: number;
      hierarchy: number;
    };
    strengths: string[];
    issues: string[];
  };
  issues: {
    severity: 'critical' | 'warning' | 'info';
    category: 'performance' | 'readability' | 'accessibility';
    message: string;
    impact: string;
  }[];
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    savings?: string;
  }[];
}

export interface UseTypographyAnalysisOptions {
  initialUrl?: string;
  autoRun?: boolean;
}

export function useTypographyAnalysis(options: UseTypographyAnalysisOptions = {}) {
  const { initialUrl = "", autoRun = false } = options;

  const [url, setUrl] = useState<string>(initialUrl);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [typographyData, setTypographyData] = useState<TypographyData | null>(null);
  
  // Track checked domains to prevent infinite loops
  const checkedDomains = useRef<Set<string>>(new Set());
  
  // Error handler integration
  const {
    error,
    isRetrying,
    clearError,
    executeWithErrorHandling
  } = useErrorHandler();

  const cleanedUrl = useMemo(() => {
    if (!url.trim()) return "";
    let clean = url.trim();
    clean = clean.replace(/^https?:\/\//, "");
    clean = clean.replace(/^www\./, "");
    clean = clean.replace(/\/.*$/, "");
    return clean.toLowerCase();
  }, [url]);

  const runAnalysis = useCallback(async () => {
    const testUrl = cleanedUrl;
    if (!testUrl) {
      toast({ title: "URL Required", description: "Please enter a URL to analyze", variant: "destructive" });
      return;
    }

    // Prevent infinite retry
    if (checkedDomains.current.has(testUrl)) {
      return;
    }

    setIsAnalyzing(true);
    setTypographyData(null);
    clearError();

    try {
      // Mark domain as checked BEFORE making request
      checkedDomains.current.add(testUrl);
      
      const data = await executeWithErrorHandling(
        async () => {
          const response = await fetch('/api/typography', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain: testUrl })
          });

          // Attach HTTP status to error
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error: any = new Error(errorData.error || 'Typography analysis failed');
            error.response = { status: response.status };
            throw error;
          }

          const result = await response.json();
          return result;
        },
        'Typography Analysis',
        testUrl
      );

      setTypographyData(data);
      toast.success("Typography analyzed successfully");
    } catch (error) {
      // Error already handled by error handler
    } finally {
      setIsAnalyzing(false);
    }
  }, [cleanedUrl, executeWithErrorHandling, clearError]);

  useEffect(() => {
    if (!autoRun) return;
    if (!initialUrl) return;
    if (typographyData || isAnalyzing) return;
    // Don't retry if domain was already checked
    if (checkedDomains.current.has(cleanedUrl)) return;
    const t = setTimeout(() => { runAnalysis(); }, 100);
    return () => clearTimeout(t);
  }, [autoRun, initialUrl, typographyData, isAnalyzing, cleanedUrl, runAnalysis]);

  return {
    url,
    setUrl,
    isAnalyzing,
    typographyData,
    runAnalysis,
    setTypographyData,
    error,
    isRetrying,
    clearError,
  };
}


