"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Download, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type SitemapNode = {
  url: string;
  title: string;
  lastModified?: string;
  status?: string;
  children?: SitemapNode[];
  alsoLinkedFrom?: string[];
};

// Group nodes by path segments, ensuring unique placement in hierarchy
function buildTree(nodes: SitemapNode[]): SitemapNode[] {
  const lookup = new Map<string, SitemapNode>();
  const roots: SitemapNode[] = [];

  // Index by URL
  nodes.forEach((n) => {
    lookup.set(n.url, { ...n, children: [], alsoLinkedFrom: [] });
  });

  // Build hierarchy
  nodes.forEach((n) => {
    try {
      const url = new URL(n.url);
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length > 1) {
        // Parent path
        const parentUrl = url.origin + "/" + parts.slice(0, -1).join("/");
        if (lookup.has(parentUrl)) {
          lookup.get(parentUrl)!.children!.push(lookup.get(n.url)!);
        } else {
          roots.push(lookup.get(n.url)!);
        }
      } else {
        roots.push(lookup.get(n.url)!);
      }
    } catch {
      roots.push(lookup.get(n.url)!);
    }
  });

  // Deduplicate children
  const dedup = (arr: SitemapNode[]) => {
    const seen = new Set();
    return arr.filter((c) => {
      if (seen.has(c.url)) return false;
      seen.add(c.url);
      return true;
    });
  };
  lookup.forEach((node) => {
    node.children = dedup(node.children || []);
  });

  return dedup(roots);
}

export default function SitemapMain() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [sitemap, setSitemap] = useState<SitemapNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (nodeUrl: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeUrl)) {
      newExpanded.delete(nodeUrl);
    } else {
      newExpanded.add(nodeUrl);
    }
    setExpandedNodes(newExpanded);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:8000/api/sitemap/' 
        : '/api/sitemap/';
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) throw new Error("Failed to fetch sitemap");
      const data = await response.json();

      // Clean hierarchy
      const cleaned = buildTree(data.sitemap || []);
      setSitemap(cleaned);

      toast({
        title: "Success",
        description: "Sitemap fetched successfully!",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to fetch sitemap",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSitemapXML = (nodes: SitemapNode[]): string => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    const traverse = (n: SitemapNode) => {
      xml += "  <url>\n";
      xml += `    <loc>${n.url}</loc>\n`;
      if (n.lastModified) {
        xml += `    <lastmod>${n.lastModified}</lastmod>\n`;
      }
      xml += "  </url>\n";
      (n.children || []).forEach(traverse);
    };
    nodes.forEach(traverse);
    xml += "</urlset>";
    return xml;
  };

  const downloadSitemap = () => {
    const xml = generateSitemapXML(sitemap);
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sitemap.xml";
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderSitemapNode = (node: SitemapNode, depth = 0) => {
    const isExpanded = expandedNodes.has(node.url);
    return (
      <div key={node.url} className="ml-4">
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => toggleNode(node.url)}
        >
          {node.children && node.children.length > 0 ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          ) : (
            <span className="w-4" />
          )}
          <span className="text-blue-600 hover:underline">{node.title || node.url}</span>
          {node.status && (
            <Badge
              variant={node.status === "success" ? "default" : "destructive"}
              className="text-xs"
            >
              {node.status}
            </Badge>
          )}
        </div>
        {isExpanded && node.children && (
          <div className="ml-6 mt-2">
            {node.children.map((child) => renderSitemapNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Website Sitemap Viewer</h1>
      <form onSubmit={handleSubmit} className="flex space-x-2 mb-4">
        <Input
          type="url"
          placeholder="Enter website URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Fetch Sitemap"}
        </Button>
      </form>
      {sitemap.length > 0 && (
        <div>
          <div className="flex justify-end mb-2">
            <Button onClick={downloadSitemap} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" /> Download XML
            </Button>
          </div>
          <Card>
            <CardContent>
              {sitemap.map((node) => renderSitemapNode(node))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
