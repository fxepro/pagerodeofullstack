"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import { UnifiedSidebar } from "@/components/unified-sidebar";
import { UnifiedHeader } from "@/components/unified-header";
import { PermissionProvider } from "@/contexts/permission-context";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [navigation, setNavigation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Allow login page without authentication
    if (pathname === '/workspace/login') {
      setLoading(false);
      return;
    }

    // Check authentication
    const token = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");
    
    if (!token) {
      router.push("/workspace/login");
      return;
    }

    // Helper function to refresh token
    const refreshAccessToken = async (): Promise<string | null> => {
      if (!refreshToken) {
        return null;
      }
      
      try {
        const res = await axios.post(`${API_BASE}/api/token/refresh/`, {
          refresh: refreshToken,
        });
        const newAccessToken = res.data.access;
        localStorage.setItem("access_token", newAccessToken);
        // Update refresh token if a new one is provided (token rotation)
        if (res.data.refresh) {
          localStorage.setItem("refresh_token", res.data.refresh);
        }
        return newAccessToken;
      } catch (err) {
        console.error("Token refresh failed:", err);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        return null;
      }
    };

    // Helper function to make authenticated request
    const makeRequest = async (url: string, currentToken: string) => {
      try {
        return await axios.get(url, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      } catch (err: any) {
        // If 401, try to refresh token and retry
        if (err.response?.status === 401) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            return await axios.get(url, {
              headers: { Authorization: `Bearer ${newToken}` },
            });
          }
          throw err; // Re-throw if refresh failed
        }
        throw err;
      }
    };

    // Fetch user info and navigation
    Promise.all([
      makeRequest(`${API_BASE}/api/user-info/`, token),
      makeRequest(`${API_BASE}/api/navigation/`, token),
    ])
      .then(([userRes, navRes]) => {
        setUser(userRes.data);
        setNavigation(navRes.data);
        // Debug: Log navigation in development
        if (process.env.NODE_ENV === 'development') {
          console.log('=== NAVIGATION DEBUG ===');
          console.log('Full navigation response:', JSON.stringify(navRes.data, null, 2));
          const allSections = navRes.data?.sections || [];
          console.log('Number of sections:', allSections.length);
          allSections.forEach((section: any, idx: number) => {
            console.log(`Section ${idx}: ${section.id} (${section.title}) - ${section.items?.length || 0} items`);
            section.items?.forEach((item: any) => {
              console.log(`  - ${item.id}: ${item.title} (${item.href})`);
            });
          });
          const siteAuditItem = allSections
            .flatMap((s: any) => s.items || [])
            .find((item: any) => item.id === 'site_audit');
          console.log('Site Audit item found:', siteAuditItem);
          console.log('User permissions:', userRes.data?.permissions?.length || 0);
          console.log('Has site_audit.view:', userRes.data?.permissions?.includes('site_audit.view'));
          console.log('======================');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading workspace:", err);
        // Clear tokens on any auth error
        if (err.response?.status === 401 || !err.response) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
        router.push("/workspace/login");
      });
  }, [router, pathname]);

  // Load sidebar collapsed state
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pagerodeo_workspace_sidebar_collapsed");
      setSidebarCollapsed(stored === "true");
    }
  }, []);

  // Save sidebar collapsed state
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pagerodeo_workspace_sidebar_collapsed", String(sidebarCollapsed));
    }
  }, [sidebarCollapsed]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Login page doesn't need layout wrapper
  if (pathname === '/workspace/login') {
    return <>{children}</>;
  }

  return (
    <PermissionProvider user={user} permissions={user?.permissions || []}>
      <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 to-palette-accent-2/80 flex flex-col">
        <UnifiedHeader
          user={user}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
          navigation={navigation}
          currentPath={pathname}
        />
        <UnifiedSidebar
          navigation={navigation}
          currentPath={pathname}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
        />
        <main className={cn(
          "pt-16 flex-1 transition-all duration-300",
          sidebarCollapsed ? "ml-20" : "ml-64"
        )}>
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </PermissionProvider>
  );
}

