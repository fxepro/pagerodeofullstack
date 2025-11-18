"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');
import { Network, Globe, Download, RefreshCw, ExternalLink, ChevronRight, ChevronDown, Zap, TreePine } from "lucide-react";
import { useRouter } from "next/navigation";

interface SitemapNode {
  url: string;
  children: SitemapNode[];
  status: "pending" | "success" | "error";
  depth: number;
}

export function SitemapMain() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [sitemap, setSitemap] = useState<SitemapNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const router = useRouter();

  // -----------------------------
  // Utility: Fetch & parse XML
  // -----------------------------
  const fetchSitemapXML = async (sitemapUrl: string): Promise<string> => {
    const apiUrl = process.env.NODE_ENV === 'development' 
      ? `${API_BASE}/api/sitemap-xml/` 
      : '/api/sitemap-xml/';
    
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sitemap_url: sitemapUrl }),
    });
    
    if (!res.ok) throw new Error(`Failed to fetch sitemap: ${res.status}`);
    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch sitemap');
    }
    
    return data.xml_content;
  };

  const parseXML = (xmlText: string): Document => {
    return new DOMParser().parseFromString(xmlText, "application/xml");
  };

  // -----------------------------
  // Extract only WordPress pages
  // -----------------------------
  const extractPageUrls = async (sitemapUrl: string): Promise<string[]> => {
    const xmlText = await fetchSitemapXML(sitemapUrl);
    const xmlDoc = parseXML(xmlText);

    // WordPress sitemap index contains multiple sitemaps
    const sitemapTags = Array.from(xmlDoc.getElementsByTagName("sitemap"));
    if (sitemapTags.length > 0) {
      const pageSitemaps = sitemapTags
        .map((node) => node.getElementsByTagName("loc")[0]?.textContent || "")
        .filter((loc) => loc.includes("page-sitemap")); // ✅ only page sitemaps

      let pageUrls: string[] = [];
      for (const pageSitemap of pageSitemaps) {
        if (!pageSitemap) continue;
        const subXmlText = await fetchSitemapXML(pageSitemap);
        const subXmlDoc = parseXML(subXmlText);
        const urls = Array.from(subXmlDoc.getElementsByTagName("url")).map(
          (urlNode) => urlNode.getElementsByTagName("loc")[0]?.textContent || ""
        );
        pageUrls = [...pageUrls, ...urls];
      }

      // Deduplicate
      return Array.from(new Set(pageUrls.filter((u) => u !== "")));
    }

    // If sitemap already contains <url> entries
    return Array.from(xmlDoc.getElementsByTagName("url"))
      .map((urlNode) => urlNode.getElementsByTagName("loc")[0]?.textContent || "")
      .filter((u) => u !== "");
  };

  // -----------------------------
  // Build hierarchy from paths
  // -----------------------------
  const buildHierarchy = (urls: string[]): SitemapNode[] => {
    const root: SitemapNode = { url: "/", children: [], status: "success", depth: 0 };

    urls.forEach((fullUrl) => {
      try {
        const { pathname } = new URL(fullUrl);
        const parts = pathname.split("/").filter(Boolean);
        let currentNode = root;

        parts.forEach((part, i) => {
          const path = "/" + parts.slice(0, i + 1).join("/");
          let child = currentNode.children.find((c) => c.url === path);
          if (!child) {
            child = { url: path, children: [], status: "success", depth: currentNode.depth + 1 };
            currentNode.children.push(child);
          }
          currentNode = child;
        });
      } catch (err) {
        console.warn("Invalid URL skipped:", fullUrl);
      }
    });

    return root.children;
  };

  // -----------------------------
  // Submit handler
  // -----------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast({ title: "Error", description: "Please enter a valid URL", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const urls = await extractPageUrls(url);
      const hierarchy = buildHierarchy(urls);
      setSitemap(hierarchy);
      toast({ title: "Success", description: `Sitemap generated: ${urls.length} pages found.` });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to generate sitemap", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Expand / Collapse
  // -----------------------------
  const toggleNode = (nodeUrl: string) => {
    const newSet = new Set(expandedNodes);
    if (newSet.has(nodeUrl)) newSet.delete(nodeUrl);
    else newSet.add(nodeUrl);
    setExpandedNodes(newSet);
  };

  // -----------------------------
  // Render tree recursively
  // -----------------------------
  const renderNode = (node: SitemapNode) => {
    const isExpanded = expandedNodes.has(node.url);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.url} className="ml-4">
        <div className="flex items-center py-2 hover:bg-gray-50 rounded px-2">
          {hasChildren ? (
            <button onClick={() => toggleNode(node.url)} className="mr-2 p-1 hover:bg-gray-200 rounded">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : <div className="w-6" />}

          <div className="flex-1 flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${node.status === 'success' ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="font-medium">{node.url}</span>
            <Badge variant="outline" className="text-xs">Depth {node.depth}</Badge>
          </div>

          <a href={node.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {isExpanded && hasChildren && <div>{node.children.map((child) => renderNode(child))}</div>}
      </div>
    );
  };

  // -----------------------------
  // Export XML
  // -----------------------------
  const exportSitemap = () => {
    const generateXML = (nodes: SitemapNode[]): string => {
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      const addNode = (node: SitemapNode) => {
        xml += `  <url>\n    <loc>${node.url}</loc>\n  </url>\n`;
        node.children.forEach(addNode);
      };

      nodes.forEach(addNode);
      xml += "</urlset>";
      return xml;
    };

    const xmlContent = generateXML(sitemap);
    const blob = new Blob([xmlContent], { type: "application/xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sitemap.xml";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    toast({ title: "Success", description: "Sitemap exported successfully!" });
  };

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center justify-center bg-gradient-to-br from-palette-accent-2 via-palette-accent-1 to-palette-primary">
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">Sitemap Generator</h1>
          <p className="text-xl md:text-2xl text-purple-100 max-w-3xl mx-auto mb-8">
            Generate and visualize WordPress page hierarchy. Only actual pages are included.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto bg-white/20 backdrop-blur-md p-6 rounded-2xl border border-white/30">
            <Input
              type="url"
              placeholder="https://example.com/sitemap_index.xml"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 text-lg h-14 bg-white/90 border-0 rounded-xl px-4 placeholder:text-gray-500 focus:ring-2 focus:ring-white/50"
            />
            <Button type="submit" disabled={loading || !url} className="h-14 px-8 bg-palette-primary text-white rounded-xl flex items-center justify-center">
              {loading ? <RefreshCw className="animate-spin mr-2 h-5 w-5" /> : <Zap className="mr-2 h-5 w-5" />}
              {loading ? "Generating..." : "Analyze"}
            </Button>
          </form>
        </div>
      </section>

      {/* Sitemap Tree */}
      {sitemap.length > 0 && (
        <Card className="max-w-6xl mx-auto mt-8 bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl flex items-center"><Network className="mr-2" /> Sitemap Structure</CardTitle>
            </div>
            <Button onClick={exportSitemap} className="bg-palette-primary text-white px-6 py-2 rounded-xl flex items-center">
              <Download className="mr-2 h-5 w-5" /> Export XML
            </Button>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">{sitemap.map((node) => renderNode(node))}</CardContent>
        </Card>
      )}
    </div>
  );
}
