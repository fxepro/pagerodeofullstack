"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { cn } from "@/lib/utils";
import UserNavigation from "@/components/user-navigation";
import UserSidebar from "@/components/user-sidebar";
import { FooterUser } from "@/components/footer-user";

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    axios.get(`${API_BASE}/api/user-info/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.data && res.data.email_verified === false) {
          router.push('/verify-email');
          return;
        }
        setUser(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(t('errors.unauthorized'));
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.push("/login");
      });
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("pagerodeo_dashboard_sidebar_collapsed");
    setSidebarCollapsed(stored === "true");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("pagerodeo_dashboard_sidebar_collapsed", sidebarCollapsed ? "true" : "false");
  }, [sidebarCollapsed]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-palette-accent-3 to-palette-accent-2/80">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-center text-palette-primary">{t('dashboard.title')}</h1>
          <p className="text-red-500 text-center">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-palette-accent-3 to-palette-accent-2/80">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-center text-palette-primary">{t('dashboard.title')}</h1>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-primary"></div>
          </div>
          <p className="text-slate-600 text-center mt-4">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Get page title based on pathname
  const getPageTitle = () => {
    if (pathname.includes('/monitoring/') && pathname !== '/dashboard/monitoring') {
      // Extract site URL from localStorage for detail pages
      const siteId = pathname.split('/monitoring/')[1];
      if (siteId) {
        try {
          const storedSites = localStorage.getItem('monitoredSites');
          if (storedSites) {
            const sites = JSON.parse(storedSites);
            const site = sites.find((s: any) => s.id === decodeURIComponent(siteId));
            if (site) {
              return `${t('monitoring.title')}: ${site.url}`;
            }
          }
        } catch (err) {
          console.error('Failed to load site from localStorage:', err);
        }
      }
      return t('monitoring.title');
    }
    if (pathname.includes('/monitoring')) return t('monitoring.title');
    if (pathname.includes('/site-audit')) return t('dashboard.siteAudit');
    if (pathname.includes('/performance')) return t('performance.title');
    if (pathname.includes('/reports')) return t('dashboard.reports');
    if (pathname.includes('/profile')) return t('navigation.profile');
    return t('dashboard.overview');
  };

  const getPageDescription = () => {
    if (pathname.includes('/monitoring/') && pathname !== '/dashboard/monitoring') {
      return t('monitoring.title');
    }
    if (pathname.includes('/monitoring')) return t('monitoring.title');
    if (pathname.includes('/site-audit')) return t('dashboard.siteAuditDesc');
    if (pathname.includes('/performance')) return t('performance.title');
    if (pathname.includes('/reports')) return t('dashboard.reports');
    if (pathname.includes('/profile')) return t('navigation.profile');
    return t('dashboard.welcome');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 to-palette-accent-2/80 flex flex-col">
      <UserNavigation
        user={user}
        pageTitle={getPageTitle()}
        pageDescription={getPageDescription()}
        sidebarCollapsed={sidebarCollapsed}
      />
      <UserSidebar
        currentPath={pathname}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />
      
      {/* Main Content */}
      <div className={cn("pt-8 flex-1 transition-all duration-300", sidebarCollapsed ? "ml-20" : "ml-64") }>
        <div className="px-8 pt-0 pb-8">
          {children}
        </div>
      </div>

      {/* User Footer - with top margin for spacing */}
      <div className={cn("mt-12 transition-all duration-300", sidebarCollapsed ? "ml-20" : "ml-64") }>
        <FooterUser />
      </div>
    </div>
  );
}
