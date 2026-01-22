"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Activity, BarChart3, Zap, Shield, Code, Brain, Link2, MessageCircle, Gauge, Eye, Lock, FileText, Menu, X, Server, Type } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    // Clear orchestrator state to prevent old reports from running
    localStorage.removeItem("pagerodeo_analysis_state");
    localStorage.removeItem("refresh_token");
    setLoggedIn(false);
    router.push("/");
  };

  return (
    <nav className="border-b border-palette-accent-2/20 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 sticky top-0 z-50">
      <div className="w-full px-4">
        <div className="flex h-20 items-center justify-between max-w-[1600px] mx-auto">
          {/* Left side - Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="group">
              <Image 
                src="/Pagerodeo-Logo-Black.png" 
                alt="PageRodeo Logo" 
                width={160} 
                height={40}
                className="object-contain group-hover:opacity-90 transition-opacity duration-300"
              />
            </Link>
          </div>

          {/* Center - Navigation */}
          <div className="hidden lg:flex items-center justify-center flex-1 mx-12">
            <div className="flex items-center space-x-8">
                <Link
                  href="/performance"
                  className={cn(
                    "text-sm font-semibold transition-all duration-300 hover:text-palette-primary relative py-2 px-2 flex items-center whitespace-nowrap",
                    pathname === "/performance"
                      ? "text-palette-primary after:absolute after:bottom-[-10px] after:left-0 after:right-0 after:h-1 after:bg-palette-primary after:rounded-full"
                      : "text-slate-600 hover:text-palette-primary",
                  )}
                >
                  <Gauge className="h-4 w-4 mr-1.5" />
                  Performance
                </Link>
                <Link
                  href="/monitor"
                  className={cn(
                    "text-sm font-semibold transition-all duration-300 hover:text-palette-primary relative py-2 px-2 flex items-center whitespace-nowrap",
                    pathname === "/monitor"
                      ? "text-palette-primary after:absolute after:bottom-[-10px] after:left-0 after:right-0 after:h-1 after:bg-palette-primary after:rounded-full"
                      : "text-slate-600 hover:text-palette-primary",
                  )}
                >
                  <Eye className="h-4 w-4 mr-1.5" />
                  Monitor
                </Link>
                <Link
                  href="/ssl"
                  className={cn(
                    "text-sm font-semibold transition-all duration-300 hover:text-palette-primary relative py-2 px-2 flex items-center whitespace-nowrap",
                    pathname === "/ssl"
                      ? "text-palette-primary after:absolute after:bottom-[-10px] after:left-0 after:right-0 after:h-1 after:bg-palette-primary after:rounded-full"
                      : "text-slate-600 hover:text-palette-primary",
                  )}
                >
                  <Lock className="h-4 w-4 mr-1.5" />
                  SSL
                </Link>
                <Link
                  href="/dns"
                  className={cn(
                    "text-sm font-semibold transition-all duration-300 hover:text-palette-primary relative py-2 px-2 flex items-center whitespace-nowrap",
                    pathname === "/dns"
                      ? "text-palette-primary after:absolute after:bottom-[-10px] after:left-0 after:right-0 after:h-1 after:bg-palette-primary after:rounded-full"
                      : "text-slate-600 hover:text-palette-primary",
                  )}
                >
                  <Server className="h-4 w-4 mr-1.5" />
                  DNS
                </Link>
                <Link
                  href="/sitemap"
                  className={cn(
                    "text-sm font-semibold transition-all duration-300 hover:text-palette-primary relative py-2 px-2 flex items-center whitespace-nowrap",
                    pathname === "/sitemap"
                      ? "text-palette-primary after:absolute after:bottom-[-10px] after:left-0 after:right-0 after:h-1 after:bg-palette-primary after:rounded-full"
                      : "text-slate-600 hover:text-palette-primary",
                  )}
                >
                  <FileText className="h-4 w-4 mr-1.5" />
                  Sitemap
                </Link>
                <Link
                  href="/api"
                  className={cn(
                    "text-sm font-semibold transition-all duration-300 hover:text-palette-primary relative py-2 px-2 flex items-center whitespace-nowrap",
                    pathname === "/api"
                      ? "text-palette-primary after:absolute after:bottom-[-10px] after:left-0 after:right-0 after:h-1 after:bg-palette-primary after:rounded-full"
                      : "text-slate-600 hover:text-palette-primary",
                  )}
                >
                  <Code className="h-4 w-4 mr-1.5" />
                  API
                </Link>
                <Link
                  href="/links"
                  className={cn(
                    "text-sm font-semibold transition-all duration-300 hover:text-palette-primary relative py-2 px-2 flex items-center whitespace-nowrap",
                    pathname === "/links"
                      ? "text-palette-primary after:absolute after:bottom-[-10px] after:left-0 after:right-0 after:h-1 after:bg-palette-primary after:rounded-full"
                      : "text-slate-600 hover:text-palette-primary",
                  )}
                >
                  <Link2 className="h-4 w-4 mr-1.5" />
                  Links
                </Link>
                <Link
                  href="/typography"
                  className={cn(
                    "text-sm font-semibold transition-all duration-300 hover:text-palette-primary relative py-2 px-2 flex items-center whitespace-nowrap",
                    pathname === "/typography"
                      ? "text-palette-primary after:absolute after:bottom-[-10px] after:left-0 after:right-0 after:h-1 after:bg-palette-primary after:rounded-full"
                      : "text-slate-600 hover:text-palette-primary",
                  )}
                >
                  <Type className="h-4 w-4 mr-1.5" />
                  Typography
                </Link>
              </div>
            </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-3">
              <Button 
                variant="outline"
                className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3 transition-all duration-300 px-3 py-2 text-sm"
                asChild
              >
                <Link href="/feedback">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Feedback
                </Link>
              </Button>
              <Button 
                variant="outline"
                className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3 transition-all duration-300 px-3 py-2 text-sm"
                asChild
              >
                <Link href="/consult">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Consult
                </Link>
              </Button>
              <Button 
                className="bg-gradient-to-r from-palette-accent-1 to-palette-primary hover:from-palette-primary hover:to-palette-primary-hover text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-300 px-3 py-2 text-sm" 
                asChild
              >
                <Link href="/upgrade">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Upgrade
                </Link>
              </Button>
              {/* Logout button - only shown when logged in */}
              {loggedIn && (
                <Button
                  className="bg-white text-palette-primary border border-palette-accent-1 hover:bg-palette-accent-3 transition-all duration-300 px-3 py-2 text-sm"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-palette-accent-2/20 bg-white/95 backdrop-blur-md">
            <div className="px-6 py-4 space-y-4">
              {/* Mobile Navigation Links */}
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/performance"
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/performance"
                      ? "bg-palette-accent-3 text-palette-primary"
                      : "text-slate-600 hover:bg-palette-accent-3 hover:text-palette-primary"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Gauge className="h-4 w-4" />
                  <span>Performance</span>
                </Link>
                <Link
                  href="/monitor"
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/monitor"
                      ? "bg-palette-accent-3 text-palette-primary"
                      : "text-slate-600 hover:bg-palette-accent-3 hover:text-palette-primary"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Eye className="h-4 w-4" />
                  <span>Monitor</span>
                </Link>
                <Link
                  href="/ssl"
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/ssl"
                      ? "bg-palette-accent-3 text-palette-primary"
                      : "text-slate-600 hover:bg-palette-accent-3 hover:text-palette-primary"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Lock className="h-4 w-4" />
                  <span>SSL Check</span>
                </Link>
                <Link
                  href="/dns"
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/dns"
                      ? "bg-palette-accent-3 text-palette-primary"
                      : "text-slate-600 hover:bg-palette-accent-3 hover:text-palette-primary"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Server className="h-4 w-4" />
                  <span>DNS Check</span>
                </Link>
                <Link
                  href="/sitemap"
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/sitemap"
                      ? "bg-palette-accent-3 text-palette-primary"
                      : "text-slate-600 hover:bg-palette-accent-3 hover:text-palette-primary"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <FileText className="h-4 w-4" />
                  <span>Sitemap</span>
                </Link>
                <Link
                  href="/api"
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/api"
                      ? "bg-palette-accent-3 text-palette-primary"
                      : "text-slate-600 hover:bg-palette-accent-3 hover:text-palette-primary"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Code className="h-4 w-4" />
                  <span>API</span>
                </Link>
                <Link
                  href="/links"
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/links"
                      ? "bg-palette-accent-3 text-palette-primary"
                      : "text-slate-600 hover:bg-palette-accent-3 hover:text-palette-primary"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link2 className="h-4 w-4" />
                  <span>Links</span>
                </Link>
                <Link
                  href="/typography"
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/typography"
                      ? "bg-palette-accent-3 text-palette-primary"
                      : "text-slate-600 hover:bg-palette-accent-3 hover:text-palette-primary"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Type className="h-4 w-4" />
                  <span>Typography</span>
                </Link>
                <Button 
                  variant="outline"
                  className="w-full border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
                  asChild
                >
                  <Link href="/feedback" onClick={() => setMobileMenuOpen(false)}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Feedback
                  </Link>
                </Button>
                {loggedIn && user && user.roles && user.roles.includes('Admin') && (
                  <Link
                    href="/admin/dashboard"
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      pathname.startsWith("/admin")
                        ? "bg-palette-accent-3 text-palette-primary"
                        : "text-slate-600 hover:bg-palette-accent-3 hover:text-palette-primary"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                )}
              </div>

              {/* Mobile Actions */}
              <div className="pt-4 border-t border-palette-accent-2/20 space-y-3">
                <Button 
                  variant="outline"
                  className="w-full border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
                  asChild
                >
                  <Link href="/consult" onClick={() => setMobileMenuOpen(false)}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Consult
                  </Link>
                </Button>
                <Button 
                  className="w-full bg-gradient-to-r from-palette-accent-1 to-palette-primary hover:from-palette-primary hover:to-palette-primary-hover text-white" 
                  asChild
                >
                  <Link href="/upgrade" onClick={() => setMobileMenuOpen(false)}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Upgrade
                  </Link>
                </Button>
                {/* Logout button - only shown when logged in */}
                {loggedIn && (
                  <Button
                    className="w-full bg-white text-palette-primary border border-palette-accent-1 hover:bg-palette-accent-3"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Logout
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
