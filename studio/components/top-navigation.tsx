"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageCircle, BarChart3, LogOut, User, FileText, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LanguageSelector } from "@/components/language-selector";
import { useTranslation } from "react-i18next";

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

export function TopNavigation() {
  const { t } = useTranslation();
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
    router.push("/");
  };

  return (
    <nav className="bg-gradient-to-r from-palette-accent-3 to-palette-accent-3/80 backdrop-blur-sm border-b border-palette-accent-2/50 sticky top-0 z-50">
      <div className="w-full px-4">
        <div className="flex h-12 items-center justify-end max-w-[1600px] mx-auto">
          {/* Right side - Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Language Selector */}
            <LanguageSelector />
            
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
                {t('navigation.blog')}
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
                {t('navigation.feedback')}
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
                {t('navigation.consult')}
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
                {t('navigation.upgrade')}
                {(pathname === "/upgrade" || pathname.startsWith("/upgrade")) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-palette-primary rounded-full animate-pulse"></span>
                )}
              </Link>
            </Button>
            
            {/* Workspace - visible to everyone */}
            <Button 
              variant="ghost"
              size="sm"
              className={cn(
                "relative transition-all duration-300 px-2 py-1 text-xs group",
                pathname === "/workspace" || pathname.startsWith("/workspace")
                  ? "text-palette-primary bg-palette-accent-3/50 font-semibold"
                  : "text-slate-700 hover:text-palette-primary hover:bg-palette-accent-3/30"
              )}
              asChild
            >
              <Link href={loggedIn ? "/workspace" : "/workspace/login"}>
                <User className={cn(
                  "h-3.5 w-3.5 mr-1 transition-transform duration-300",
                  pathname === "/workspace" || pathname.startsWith("/workspace") ? "scale-110" : "group-hover:scale-110"
                )} />
                Workspace
                {(pathname === "/workspace" || pathname.startsWith("/workspace")) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-palette-primary rounded-full animate-pulse"></span>
                )}
              </Link>
            </Button>
            
            {/* Logout button - only shown when logged in */}
            {loggedIn && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-700 hover:text-palette-primary hover:bg-palette-accent-3/30 transition-all duration-300 px-2 py-1 text-xs"
                  onClick={handleLogout}
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" />
                  {t('navigation.logout')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
