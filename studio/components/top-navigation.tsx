"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageCircle, BarChart3, LogIn, LogOut, User, FileText, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

export function TopNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Update loggedIn state on mount, route change, and storage events
  useEffect(() => {
    const checkAuthState = () => {
      if (typeof window === 'undefined') return;
      const token = localStorage.getItem("access_token");
      const isLoggedIn = !!token;
      setLoggedIn(isLoggedIn);
      
      if (token) {
        // Fetch user info to check roles
        fetch(`${API_BASE}/api/user-info/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => {
            if (res.ok) {
              return res.json();
            }
            throw new Error('Unauthorized');
          })
          .then(data => setUser(data))
          .catch(() => {
            // Token invalid, clear it
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            setLoggedIn(false);
            setUser(null);
          });
      } else {
        setUser(null);
      }
    };

    checkAuthState();
    // Listen for storage changes (e.g., logout from another tab)
    window.addEventListener("storage", checkAuthState);
    return () => window.removeEventListener("storage", checkAuthState);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem("access_token");
    const isLoggedIn = !!token;
    setLoggedIn(isLoggedIn);
    
    if (token) {
      fetch(`${API_BASE}/api/user-info/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          if (res.ok) {
            return res.json();
          }
          throw new Error('Unauthorized');
        })
        .then(data => setUser(data))
        .catch(() => {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          setLoggedIn(false);
          setUser(null);
        });
    } else {
      setUser(null);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    // Clear orchestrator state to prevent old reports from running
    localStorage.removeItem("pagerodeo_analysis_state");
    setLoggedIn(false);
    router.push("/login");
  };

  return (
    <nav className="bg-gradient-to-r from-palette-accent-3 to-palette-accent-3/80 backdrop-blur-sm border-b border-palette-accent-2/50 sticky top-0 z-50">
      <div className="w-full px-4">
        <div className="flex h-12 items-center justify-end max-w-[1600px] mx-auto">
          {/* Right side - Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost"
              size="sm"
              className={cn(
                "relative transition-all duration-300 px-2 py-1 text-xs group",
                pathname === "/blog" || pathname.startsWith("/blog")
                  ? "text-palette-primary bg-palette-accent-3/50 font-semibold"
                  : "text-slate-700 hover:text-palette-primary hover:bg-palette-accent-3/30"
              )}
              asChild
            >
              <Link href="/blog">
                <FileText className={cn(
                  "h-3.5 w-3.5 mr-1 transition-transform duration-300",
                  pathname === "/blog" || pathname.startsWith("/blog") ? "scale-110" : "group-hover:scale-110"
                )} />
                Blog
                {(pathname === "/blog" || pathname.startsWith("/blog")) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-palette-primary rounded-full animate-pulse"></span>
                )}
              </Link>
            </Button>
            
            <Button 
              variant="ghost"
              size="sm"
              className={cn(
                "relative transition-all duration-300 px-2 py-1 text-xs group",
                pathname === "/feedback" || pathname.startsWith("/feedback")
                  ? "text-palette-primary bg-palette-accent-3/50 font-semibold"
                  : "text-slate-700 hover:text-palette-primary hover:bg-palette-accent-3/30"
              )}
              asChild
            >
              <Link href="/feedback">
                <MessageCircle className={cn(
                  "h-3.5 w-3.5 mr-1 transition-transform duration-300",
                  pathname === "/feedback" || pathname.startsWith("/feedback") ? "scale-110" : "group-hover:scale-110"
                )} />
                Feedback
                {(pathname === "/feedback" || pathname.startsWith("/feedback")) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-palette-primary rounded-full animate-pulse"></span>
                )}
              </Link>
            </Button>
            
            <Button 
              variant="ghost"
              size="sm"
              className={cn(
                "relative transition-all duration-300 px-2 py-1 text-xs group",
                pathname === "/consult" || pathname.startsWith("/consult")
                  ? "text-palette-primary bg-palette-accent-3/50 font-semibold"
                  : "text-slate-700 hover:text-palette-primary hover:bg-palette-accent-3/30"
              )}
              asChild
            >
              <Link href="/consult">
                <User className={cn(
                  "h-3.5 w-3.5 mr-1 transition-transform duration-300",
                  pathname === "/consult" || pathname.startsWith("/consult") ? "scale-110" : "group-hover:scale-110"
                )} />
                Consult
                {(pathname === "/consult" || pathname.startsWith("/consult")) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-palette-primary rounded-full animate-pulse"></span>
                )}
              </Link>
            </Button>
            
            <Button 
              variant="ghost"
              size="sm"
              className={cn(
                "relative transition-all duration-300 px-2 py-1 text-xs group",
                pathname === "/upgrade" || pathname.startsWith("/upgrade")
                  ? "text-palette-primary bg-palette-accent-3/50 font-semibold"
                  : "text-slate-700 hover:text-palette-primary hover:bg-palette-accent-3/30"
              )}
              asChild
            >
              <Link href="/upgrade">
                <BarChart3 className={cn(
                  "h-3.5 w-3.5 mr-1 transition-transform duration-300",
                  pathname === "/upgrade" || pathname.startsWith("/upgrade") ? "scale-110" : "group-hover:scale-110"
                )} />
                Upgrade
                {(pathname === "/upgrade" || pathname.startsWith("/upgrade")) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-palette-primary rounded-full animate-pulse"></span>
                )}
              </Link>
            </Button>
            
            {loggedIn ? (
              <>
                {/* Dashboard - for all logged-in users */}
                <Button 
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "relative transition-all duration-300 px-2 py-1 text-xs group",
                    pathname === "/dashboard" || pathname.startsWith("/dashboard") || pathname === "/admin/dashboard" || pathname.startsWith("/admin/dashboard")
                      ? "text-palette-primary bg-palette-accent-3/50 font-semibold"
                      : "text-slate-700 hover:text-palette-primary hover:bg-palette-accent-3/30"
                  )}
                  asChild
                >
                  <Link href={user?.role === 'admin' ? "/admin/dashboard" : "/dashboard"}>
                    <User className={cn(
                      "h-3.5 w-3.5 mr-1 transition-transform duration-300",
                      pathname === "/dashboard" || pathname.startsWith("/dashboard") || pathname === "/admin/dashboard" || pathname.startsWith("/admin/dashboard") ? "scale-110" : "group-hover:scale-110"
                    )} />
                    Dashboard
                    {(pathname === "/dashboard" || pathname.startsWith("/dashboard") || pathname === "/admin/dashboard" || pathname.startsWith("/admin/dashboard")) && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-palette-primary rounded-full animate-pulse"></span>
                    )}
                  </Link>
                </Button>
                
                {/* Logout button for all logged-in users */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-700 hover:text-palette-primary hover:bg-palette-accent-3/30 transition-all duration-300 px-2 py-1 text-xs"
                  onClick={handleLogout}
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" />
                  Logout
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "relative transition-all duration-300 px-2 py-1 text-xs group",
                  pathname === "/login" || pathname.startsWith("/login")
                    ? "text-palette-primary bg-palette-accent-3/50 font-semibold"
                    : "text-slate-700 hover:text-palette-primary hover:bg-palette-accent-3/30"
                )}
                asChild
              >
                <Link href="/login">
                  <LogIn className={cn(
                    "h-3.5 w-3.5 mr-1 transition-transform duration-300",
                    pathname === "/login" || pathname.startsWith("/login") ? "scale-110" : "group-hover:scale-110"
                  )} />
                  Login
                  {(pathname === "/login" || pathname.startsWith("/login")) && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-palette-primary rounded-full animate-pulse"></span>
                  )}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
