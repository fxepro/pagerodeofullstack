"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import { useErrorHandler } from "./use-error-handler";

export interface SitemapNode {
  url: string;
  title: string;
  depth: number;
  children: SitemapNode[];
  status: 'pending' | 'success' | 'error';
  lastModified?: string;
  priority?: number;
}

export interface UseSitemapAnalysisOptions {
  initialUrl?: string;
  autoRun?: boolean;
}

export function useSitemapAnalysis(options: UseSitemapAnalysisOptions = {}) {
  const { initialUrl = "", autoRun = false } = options;

  const [url, setUrl] = useState<string>(initialUrl);
  const [loading, setLoading] = useState<boolean>(false);
  const [sitemap, setSitemap] = useState<SitemapNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
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
    clean = clean.replace(/^https?:\/\//, '');
    clean = clean.replace(/^www\./, '');
    clean = clean.replace(/\/.*$/, '');
    return clean.toLowerCase();
  }, [url]);

  const countTotalPages = useCallback((nodes: SitemapNode[]): number => {
    let count = nodes.length;
    for (const node of nodes) {
      count += countTotalPages(node.children);
    }
    return count;
  }, []);

  const toggleNode = useCallback((nodeUrl: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeUrl)) next.delete(nodeUrl); else next.add(nodeUrl);
      return next;
    });
  }, []);

  const getDisplayedLinks = useCallback((): (SitemapNode & { displayDepth?: number })[] => {
    const renderTreeNodes = (nodes: SitemapNode[], depth: number = 0): (SitemapNode & { displayDepth?: number })[] => {
      const result: (SitemapNode & { displayDepth?: number })[] = [];
      nodes.forEach(node => {
        const nodeWithDepth = { ...node, displayDepth: depth } as SitemapNode & { displayDepth?: number };
        result.push(nodeWithDepth);
        if (node.children && node.children.length > 0 && expandedNodes.has(node.url)) {
          const children = renderTreeNodes(node.children, depth + 1);
          result.push(...children);
        }
      });
      return result;
    };
    return renderTreeNodes(sitemap);
  }, [sitemap, expandedNodes]);

  const exportSitemap = useCallback(() => {
    const generateSitemapXML = (nodes: SitemapNode[]): string => {
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      const addNode = (node: SitemapNode) => {
        xml += '  <url>\n';
        xml += `    <loc>${node.url}</loc>\n`;
        if (node.lastModified) {
          xml += `    <lastmod>${new Date(node.lastModified).toISOString().split('T')[0]}</lastmod>\n`;
        }
        if (node.priority) {
          xml += `    <priority>${node.priority}</priority>\n`;
        }
        xml += '  </url>\n';
        node.children.forEach(child => addNode(child));
      };
      nodes.forEach(node => addNode(node));
      xml += '</urlset>';
      return xml;
    };
    const sitemapXml = generateSitemapXML(sitemap);
    const blob = new Blob([sitemapXml], { type: 'application/xml' });
    const urlObj = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlObj;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(urlObj);
    toast.success("Sitemap exported successfully!");
  }, [sitemap]);

  const runAnalysis = useCallback(async () => {
    if (!cleanedUrl) {
      toast.error("Please enter a valid URL");
      return;
    }
    
    // Prevent infinite retry
    if (checkedDomains.current.has(cleanedUrl)) {
      return;
    }
    
    const fullUrl = 'https://' + cleanedUrl;
    setLoading(true);
    setSitemap([]);
    clearError();
    
    try {
      // Mark domain as checked BEFORE making request
      checkedDomains.current.add(cleanedUrl);
      
      const data = await executeWithErrorHandling(
        async () => {
          // Use Next.js API route which wraps Django backend
          const apiUrl = '/api/sitemap';
          const response = await fetch(apiUrl, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ url: fullUrl }) 
          });
          
          // Attach HTTP status to error
          if (!response.ok) {
            let errorMessage = 'Failed to generate sitemap';
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
            } catch {
              errorMessage = `Server error (${response.status}). Make sure the Django backend is running on port 8000.`;
            }
            const error: any = new Error(errorMessage);
            error.response = { status: response.status };
            throw error;
          }
          
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Invalid response format. Make sure the Django backend is running and accessible.');
          }
          
          const result = await response.json();
          return result;
        },
        'Sitemap Analysis',
        cleanedUrl
      );
      
      setSitemap(data.sitemap || []);
      const expandDepth0And1 = (nodes: SitemapNode[]): string[] => {
        const urls: string[] = [];
        const traverse = (nodeList: SitemapNode[], currentDepth: number = 0) => {
          nodeList.forEach(node => {
            if (currentDepth <= 1) urls.push(node.url);
            if (node.children && node.children.length > 0 && currentDepth < 1) traverse(node.children, currentDepth + 1);
          });
        };
        traverse(nodes);
        return urls;
      };
      setExpandedNodes(new Set(expandDepth0And1(data.sitemap || [])));
      toast.success(`Sitemap generated successfully! Found ${data.total_pages} pages.`);
    } catch (err: any) {
      // Error already handled by error handler
    } finally {
      setLoading(false);
    }
  }, [cleanedUrl, executeWithErrorHandling, clearError]);

  useEffect(() => {
    if (!autoRun) return;
    if (!initialUrl) return;
    if (sitemap.length > 0 || loading) return;
    // Don't retry if domain was already checked
    if (checkedDomains.current.has(cleanedUrl)) return;
    const t = setTimeout(() => { runAnalysis(); }, 100);
    return () => clearTimeout(t);
  }, [autoRun, initialUrl, sitemap.length, loading, cleanedUrl, runAnalysis]);

  return {
    url,
    setUrl,
    loading,
    sitemap,
    expandedNodes,
    setExpandedNodes,
    countTotalPages,
    toggleNode,
    getDisplayedLinks,
    exportSitemap,
    runAnalysis,
    error,
    isRetrying,
    clearError,
  };
}


