"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import AdminSidebar from "@/components/admin-sidebar";
import AdminHeader from "@/components/admin-header";

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Allow /admin/login without authentication
    if (pathname === '/admin/login') {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    axios.get(`${API_BASE}/api/user-info/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        setUser(res.data);
        // Normalize role check (handle uppercase or undefined)
        const normalizedRole = (res.data.role ?? '').toString().toLowerCase();
        if (normalizedRole !== 'admin') {
          router.push("/dashboard");
        }
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.push("/admin/login");
      })
      .finally(() => setLoading(false));
  }, [router, pathname]);

  // For login page, render without layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <AdminHeader user={user} />
      <div className="flex">
        <AdminSidebar currentPath={pathname} />
        <main className="flex-1 ml-64">
          {children}
        </main>
      </div>
    </div>
  );
}
