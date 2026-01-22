"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { applyTheme } from "@/lib/theme";
import { BookOpen, Wrench, Shield, Plug, Search, Gauge, TrendingUp, BarChart3, Cpu, Database, Network, Settings, Users, LayoutDashboard, CreditCard, FileText, Globe, CircleDollarSign, MapPin, Lock, Package, MessageSquare, ExternalLink, Loader2, Clock, Video, Plus } from "lucide-react";
import { fetchLearningMaterials, type LearningMaterial } from "@/lib/api/collateral";

interface CategoryMaterials {
  category: string;
  materials: LearningMaterial[];
  loading: boolean;
}

export default function CollateralPage() {
  const router = useRouter();
  const [categoryMaterials, setCategoryMaterials] = useState<{
    'my-tools': CategoryMaterials;
    'administration': CategoryMaterials;
    'integrations': CategoryMaterials;
  }>({
    'my-tools': { category: 'my-tools', materials: [], loading: true },
    'administration': { category: 'administration', materials: [], loading: true },
    'integrations': { category: 'integrations', materials: [], loading: true },
  });

  useEffect(() => {
    const fetchMaterials = async () => {
      const categories = ['my-tools', 'administration', 'integrations'] as const;
      
      for (const category of categories) {
        try {
          const response = await fetchLearningMaterials({
            category: category,
            status: 'published',
            page_size: 50, // Get all materials for each category
            ordering: '-published_at'
          });
          
          setCategoryMaterials(prev => ({
            ...prev,
            [category]: {
              category,
              materials: response.results || [],
              loading: false
            }
          }));
        } catch (error) {
          console.error(`Error fetching materials for ${category}:`, error);
          setCategoryMaterials(prev => ({
            ...prev,
            [category]: {
              category,
              materials: [],
              loading: false
            }
          }));
        }
      }
    };

    fetchMaterials();
  }, []);

  const myToolsLinks = [
    { href: "/workspace/site-audit", title: "Site Audit", icon: Search, tag: "site-audit" },
    { href: "/workspace/performance", title: "Performance", icon: Gauge, tag: "performance" },
    { href: "/workspace/monitoring", title: "Monitoring", icon: TrendingUp, tag: "monitoring" },
    { href: "/workspace/reports", title: "Reports", icon: BarChart3, tag: "reports" },
    { href: "/workspace/ai-health", title: "AI Monitoring", icon: Cpu, tag: "ai-health" },
    { href: "/workspace/database-monitoring", title: "Database Monitoring", icon: Database, tag: "database-monitoring" },
    { href: "/workspace/security-monitoring", title: "Security Monitoring", icon: Shield, tag: "security-monitoring" },
    { href: "/workspace/api-monitoring-user", title: "API Monitoring", icon: Network, tag: "api-monitoring" },
    { href: "/workspace/settings", title: "Settings", icon: Settings, tag: "settings" },
  ];

  const adminLinks = [
    { href: "/workspace/admin-overview", title: "Overview", icon: LayoutDashboard, tag: "admin-overview" },
    { href: "/workspace/users", title: "User Management", icon: Users, tag: "user-management" },
    { href: "/workspace/roles", title: "Role Management", icon: Shield, tag: "roles" },
    { href: "/workspace/analytics", title: "Analytics", icon: BarChart3, tag: "analytics" },
    { href: "/workspace/api-monitoring", title: "API Monitoring", icon: Network, tag: "api-monitoring" },
    { href: "/workspace/tools-management", title: "Tools Management", icon: Wrench, tag: "tools-management" },
    { href: "/workspace/themes", title: "Theme Manager", icon: FileText, tag: "themes" },
    { href: "/workspace/feedback", title: "Feedback", icon: MessageSquare, tag: "feedback" },
    { href: "/workspace/financials", title: "Financials", icon: CreditCard, tag: "financials" },
    { href: "/workspace/marketing", title: "Marketing & Deals", icon: TrendingUp, tag: "marketing" },
    { href: "/workspace/affiliates", title: "Affiliates", icon: Users, tag: "affiliates" },
    { href: "/workspace/blogging", title: "Blogging", icon: FileText, tag: "blogging" },
    { href: "/workspace/system-settings", title: "System Settings", icon: Settings, tag: "system-settings" },
    { href: "/workspace/multi-language", title: "Multi-Language", icon: Globe, tag: "multi-language" },
    { href: "/workspace/multi-currency", title: "Multi-Currency", icon: CircleDollarSign, tag: "multi-currency" },
    { href: "/workspace/multi-location", title: "Multi-Location", icon: MapPin, tag: "multi-location" },
    { href: "/workspace/security", title: "Site Security", icon: Lock, tag: "security" },
  ];

  const integrationsLinks = [
    { href: "/workspace/google-analytics", title: "Google Analytics", icon: TrendingUp, tag: "google-analytics" },
    { href: "/workspace/wordpress", title: "WordPress", icon: Package, tag: "wordpress" },
    { href: "/workspace/communication", title: "Communication", icon: MessageSquare, tag: "communication" },
  ];

  const getMaterialsForTag = (category: 'my-tools' | 'administration' | 'integrations', tag: string) => {
    const materials = categoryMaterials[category].materials;
    return materials.filter(material => 
      material.tags.some(t => t.slug === tag || t.name.toLowerCase() === tag.toLowerCase()) ||
      material.related_feature === tag
    );
  };

  const renderCategorySection = (
    title: string,
    icon: React.ComponentType<{ className?: string }>,
    links: Array<{ href: string; title: string; icon: React.ComponentType<{ className?: string }>; tag: string }>,
    category: 'my-tools' | 'administration' | 'integrations',
    loading: boolean
  ) => {
    const IconComponent = icon;
    
    return (
      <Card className={applyTheme.card()}>
        <CardHeader>
          <CardTitle className={`${applyTheme.text('primary')} flex items-center gap-2`}>
            <IconComponent className="h-5 w-5 text-palette-primary" />
            {title}
          </CardTitle>
          <CardDescription className={applyTheme.text('secondary')}>
            Learning resources for {title} features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
              {links.map((link) => {
                const LinkIcon = link.icon;
                const relatedMaterials = getMaterialsForTag(category, link.tag);
                
                return (
                  <div key={link.href} className="space-y-2">
                    <div className="flex items-center gap-2 p-2 rounded-md">
                      <LinkIcon className="h-4 w-4" />
                      <span className={`font-medium ${applyTheme.text('primary')}`}>{link.title}</span>
                      {relatedMaterials.length > 0 && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {relatedMaterials.length}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Show learning materials for this feature */}
                    {loading ? (
                      <div className="ml-6 flex items-center gap-2 text-sm text-slate-500">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Loading...</span>
                      </div>
                    ) : relatedMaterials.length > 0 ? (
                      <div className="ml-6 space-y-1">
                        {relatedMaterials.map((material) => (
                          <Link
                            key={material.id}
                            href={`/workspace/collateral/${material.slug}`}
                            className="flex items-center gap-2 text-sm text-slate-600 hover:text-palette-primary transition-colors group"
                          >
                            {material.content_type === 'video' ? (
                              <Video className="h-3 w-3" />
                            ) : (
                              <FileText className="h-3 w-3" />
                            )}
                            <span className="truncate">{material.title}</span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="ml-6 text-sm text-slate-400 italic">
                        No learning materials yet
                      </div>
                    )}
                </div>
              );
            })}
            
            {/* Show all materials for this category if no specific tag matches */}
            {!loading && categoryMaterials[category].materials.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className={`text-sm font-semibold mb-2 ${applyTheme.text('primary')}`}>All Learning Materials</p>
                <div className="space-y-2">
                  {categoryMaterials[category].materials.map((material) => (
                    <Link
                      key={material.id}
                      href={`/workspace/collateral/${material.slug}`}
                      className="flex items-start gap-2 p-2 rounded-md hover:bg-slate-100 transition-colors group"
                    >
                      {material.content_type === 'video' ? (
                        <Video className="h-4 w-4 mt-0.5 text-palette-primary" />
                      ) : (
                        <FileText className="h-4 w-4 mt-0.5 text-palette-primary" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${applyTheme.text('primary')} group-hover:text-palette-primary transition-colors`}>
                          {material.title}
                        </p>
                        {material.excerpt && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{material.excerpt}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {material.content_type}
                          </Badge>
                          {material.tags.map((tag) => (
                            <Badge key={tag.id} variant="outline" className="text-xs">
                              {tag.name}
                            </Badge>
                          ))}
                          {material.read_time > 0 && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {material.read_time} min
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h4-dynamic font-bold">Collateral</h1>
          <p className="text-muted-foreground mt-1">Learning resources, documentation, and helpful materials for using PageRodeo</p>
        </div>
        <Button onClick={() => router.push('/workspace/collateral/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Material
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {renderCategorySection(
          "My Tools",
          Wrench,
          myToolsLinks,
          'my-tools',
          categoryMaterials['my-tools'].loading
        )}

        {renderCategorySection(
          "Administration",
          Shield,
          adminLinks,
          'administration',
          categoryMaterials['administration'].loading
        )}

        {renderCategorySection(
          "Integrations",
          Plug,
          integrationsLinks,
          'integrations',
          categoryMaterials['integrations'].loading
        )}
      </div>
    </div>
  );
}
