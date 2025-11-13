"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  MessageSquare,
  BarChart3,
  ChevronRight,
  Palette,
  Monitor
} from "lucide-react";

interface AdminSidebarProps {
  currentPath: string;
}

export default function AdminSidebar({ currentPath }: AdminSidebarProps) {
  const sidebarItems = [
    {
      title: "Overview",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      description: "System overview and analytics"
    },
    {
      title: "User Management",
      href: "/admin/users",
      icon: Users,
      description: "Manage user accounts and permissions"
    },
    {
      title: "Role Management",
      href: "/admin/roles",
      icon: Shield,
      description: "Configure roles and access control"
    },
    {
      title: "Theme Manager",
      href: "/admin/themes",
      icon: Palette,
      description: "Manage color palettes and branding"
    },
    {
      title: "Feedback",
      href: "/admin/feedback",
      icon: MessageSquare,
      description: "View and manage user feedback"
    },
    {
      title: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
      description: "System performance and usage metrics"
    },
    {
      title: "Monitoring",
      href: "/admin/monitoring",
      icon: Monitor,
      description: "System health, jobs, and logs"
    },
    {
      title: "System Settings",
      href: "/admin/settings",
      icon: Settings,
      description: "Application configuration"
    }
  ];


  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-gradient-to-b from-slate-100 to-slate-200/80 backdrop-blur-sm border-r border-slate-300/50 overflow-y-auto">
      <div className="p-6 space-y-8">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">PageRodeo</h2>
            <p className="text-xs text-slate-600">Admin Panel</p>
          </div>
        </div>

        {/* Admin Navigation */}
        <div>
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-4">
            Admin Panel
          </h3>
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const isActive = currentPath === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-slate-600 text-white"
                      : "text-slate-700 hover:text-slate-800 hover:bg-slate-200/50"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-slate-500 truncate">{item.description}</p>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
                </Link>
              );
            })}
          </nav>
        </div>


        {/* System Status */}
        <div className="bg-slate-200/50 rounded-lg p-4 border border-slate-300/30">
          <h4 className="text-sm font-semibold text-slate-800 mb-2">System Status</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">API Status</span>
              <span className="text-green-600 font-medium">Online</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Database</span>
              <span className="text-green-600 font-medium">Healthy</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">AI Services</span>
              <span className="text-yellow-600 font-medium">Warning</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
