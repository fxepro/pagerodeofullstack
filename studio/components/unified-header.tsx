"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UnifiedHeaderProps {
  user: any;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  navigation?: any;
  currentPath?: string;
}

export function UnifiedHeader({ user, sidebarCollapsed, onToggleSidebar, navigation, currentPath }: UnifiedHeaderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Find current page title from navigation
  const getCurrentPageTitle = () => {
    if (!navigation || !currentPath) return "Workspace";
    
    // Normalize path (remove trailing slash, handle query params)
    const normalizedPath = currentPath.split('?')[0].replace(/\/$/, '') || '/workspace';
    
    // Search through all sections and items for exact match
    for (const section of navigation.sections || []) {
      for (const item of section.items || []) {
        const normalizedHref = item.href?.replace(/\/$/, '') || '';
        if (normalizedHref === normalizedPath) {
          return item.title;
        }
      }
    }
    
    // Try partial matching for dynamic routes (e.g., /workspace/monitoring/123)
    for (const section of navigation.sections || []) {
      for (const item of section.items || []) {
        if (item.href && normalizedPath.startsWith(item.href)) {
          return item.title;
        }
      }
    }
    
    // Fallback mapping for common routes not in navigation
    const routeTitleMap: Record<string, string> = {
      '/workspace': 'Overview',
      '/workspace/login': 'Login',
      '/workspace/profile': 'Profile',
      '/workspace/settings': 'Settings',
      '/workspace/site-audit': 'Site Audit',
      '/workspace/performance': 'Performance',
      '/workspace/monitoring': 'Monitoring',
      '/workspace/reports': 'Reports',
      '/workspace/users': 'User Management',
      '/workspace/roles': 'Role Management',
      '/workspace/analytics': 'Analytics',
      '/workspace/themes': 'Theme Manager',
      '/workspace/feedback': 'Feedback',
      '/workspace/financials': 'Financials',
      '/workspace/system-settings': 'System Settings',
      '/workspace/admin-overview': 'Admin Overview',
      '/workspace/api-monitoring': 'API Monitoring',
      '/workspace/tools-management': 'Tools Management',
      '/workspace/ai-health': 'AI Health',
      '/workspace/api-monitoring-user': 'API Monitoring',
      '/workspace/google-analytics': 'Google Analytics',
    };
    
    // Check fallback map
    if (routeTitleMap[normalizedPath]) {
      return routeTitleMap[normalizedPath];
    }
    
    // Try to extract title from pathname for dynamic routes
    const pathParts = normalizedPath.split('/').filter(Boolean);
    if (pathParts.length > 1) {
      const lastPart = pathParts[pathParts.length - 1];
      // Skip numeric IDs
      if (!/^\d+$/.test(lastPart) && pathParts.length > 2) {
        const parentPath = '/' + pathParts.slice(0, -1).join('/');
        if (routeTitleMap[parentPath]) {
          return routeTitleMap[parentPath];
        }
      }
    }
    
    // Default fallback
    return "Workspace";
  };

  const currentPageTitle = getCurrentPageTitle();

  const handleLogout = () => {
    setLoading(true);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("pagerodeo_analysis_state");
    router.push("/");
  };

  return (
    <header className="fixed top-0 right-0 left-0 h-16 bg-white border-b border-gray-200 shadow-sm z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold text-slate-800">{currentPageTitle}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm text-slate-600">
          <span className="font-medium">{user?.username || 'User'}</span>
          <span className="text-slate-400 mx-2">•</span>
          <span className="capitalize">{user?.role || 'viewer'}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.username || 'User'}</p>
                <p className="text-xs text-slate-500">{user?.email || ''}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/workspace/profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/workspace/preferences')}>
              <User className="mr-2 h-4 w-4" />
              Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={loading}>
              <LogOut className="mr-2 h-4 w-4" />
              {loading ? "Logging out..." : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

