"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserNavigationProps {
  user: any;
  pageTitle?: string;
  pageDescription?: string;
  sidebarCollapsed?: boolean;
}

export default function UserNavigation({ user, pageTitle, pageDescription, sidebarCollapsed = false }: UserNavigationProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    // Clear orchestrator state to prevent old reports from running
    localStorage.removeItem("pagerodeo_analysis_state");
    router.push("/");
  };

  return (
    <nav
      className={cn(
        "bg-palette-accent-2 border-b border-palette-accent-1 shadow-lg transition-all duration-300",
        sidebarCollapsed ? "ml-20" : "ml-64"
      )}
    >
      <div className="w-full px-6">
        <div className="flex items-center justify-between min-h-16 py-3">
          {/* Page Title - Contextual */}
          <div className="flex items-center">
            {pageTitle && (
              <div>
                <h1 className="palette-heading-dashboard text-xl font-bold text-slate-800">{pageTitle}</h1>
                {pageDescription && (
                  <p className="palette-description-dashboard text-sm text-slate-600 mt-1">{pageDescription}</p>
                )}
              </div>
            )}
          </div>

          {/* Right Side - User Avatar & Logout */}
          <div className="flex items-center gap-2 ml-auto">
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:text-palette-primary hover:bg-palette-accent-3 transition-all"
            >
              <div className="w-8 h-8 bg-palette-primary rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium">{user?.username || 'User'}</span>
            </Link>
            
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-gray-700 hover:bg-red-100 hover:text-red-700 transition-all"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

