"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Activity, BarChart3, Zap, Shield, Code, Link2, Gauge, Eye, Lock, FileText, Menu, X, Server, Type } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export function MainNavigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b border-palette-accent-2/20 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 sticky top-12 z-40">
      <div className="w-full px-4">
        <div className="flex h-16 items-center justify-between max-w-[1600px] mx-auto">
          {/* Left side - Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className={cn(
              "group relative",
              pathname === "/" && "after:absolute after:bottom-[-10px] after:left-0 after:right-0 after:h-1 after:bg-palette-primary after:rounded-full after:animate-pulse"
            )}>
              <Image 
                src="/Pagerodeo-Logo-Black.png" 
                alt="PageRodeo Logo" 
                width={160} 
                height={40}
                className={cn(
                  "object-contain transition-all duration-300",
                  pathname === "/" ? "opacity-100" : "group-hover:opacity-90"
                )}
              />
            </Link>
          </div>

          {/* Center - Feature Navigation */}
          <div className="hidden lg:flex items-center justify-center flex-1 mx-12">
            <div className="flex items-center space-x-8">
              <Link
                href="/performance"
                className={cn(
                  "text-sm font-semibold transition-all duration-300 hover:text-palette-primary relative py-2 px-2 flex items-center whitespace-nowrap group",
                  pathname === "/performance" || pathname.startsWith("/performance")
                    ? "text-palette-primary font-bold after:absolute after:bottom-[-10px] after:left-0 after:right-0 after:h-1 after:bg-palette-primary after:rounded-full after:animate-pulse"
                    : "text-slate-600 hover:text-palette-primary",
                )}
              >
                <Gauge className={cn(
                  "h-4 w-4 mr-1.5 transition-transform duration-300",
                  pathname === "/performance" || pathname.startsWith("/performance") ? "scale-110" : "group-hover:scale-110"
                )} />
                Performance
              </Link>
              <Link
                href="/monitor"
                className={cn(
                  "text-sm font-semibold transition-all duration-300 hover:text-palette-primary relative py-2 px-2 flex items-center whitespace-nowrap group",
                  pathname === "/monitor" || pathname.startsWith("/monitor")
                    ? "text-palette-primary font-bold after:absolute after:bottom-[-10px] after:left-0 after:right-0 after:h-1 after:bg-palette-primary after:rounded-full after:animate-pulse"
                    : "text-slate-600 hover:text-palette-primary",
                )}
              >
                <Eye className={cn(
                  "h-4 w-4 mr-1.5 transition-transform duration-300",
                  pathname === "/monitor" || pathname.startsWith("/monitor") ? "scale-110" : "group-hover:scale-110"
                )} />
                Monitor
              </Link>
              <Link
                href="/ssl"
                className={cn(
                  "text-sm font-semibold transition-all duration-300 hover:text-palette-primary relative py-2 px-2 flex items-center whitespace-nowrap group",
                  pathname === "/ssl" || pathname.startsWith("/ssl")
                    ? "text-palette-primary font-bold after:absolute after:bottom-[-10px] after:left-0 after:right-0 after:h-1 after:bg-palette-primary after:rounded-full after:animate-pulse"
                    : "text-slate-600 hover:text-palette-primary",
                )}
              >
                <Lock className={cn(
                  "h-4 w-4 mr-1.5 transition-transform duration-300",
                  pathname === "/ssl" || pathname.startsWith("/ssl") ? "scale-110" : "group-hover:scale-110"
                )} />
                SSL
              </Link>
              <Link
                href="/dns"
                className={cn(
                  "text-sm font-semibold transition-all duration-300 hover:text-palette-primary relative py-2 px-2 flex items-center whitespace-nowrap group",
                  pathname === "/dns" || pathname.startsWith("/dns")
                    ? "text-palette-primary font-bold after:absolute after:bottom-[-10px] after:left-0 after:right-0 after:h-1 after:bg-palette-primary after:rounded-full after:animate-pulse"
                    : "text-slate-600 hover:text-palette-primary",
                )}
              >
                <Server className={cn(
                  "h-4 w-4 mr-1.5 transition-transform duration-300",
                  pathname === "/dns" || pathname.startsWith("/dns") ? "scale-110" : "group-hover:scale-110"
                )} />
                DNS
              </Link>
              <Link
                href="/sitemap"
                className={cn(
                  "text-sm font-semibold transition-all duration-300 hover:text-palette-primary relative py-2 px-2 flex items-center whitespace-nowrap group",
                  pathname === "/sitemap" || pathname.startsWith("/sitemap")
                    ? "text-palette-primary font-bold after:absolute after:bottom-[-10px] after:left-0 after:right-0 after:h-1 after:bg-palette-primary after:rounded-full after:animate-pulse"
                    : "text-slate-600 hover:text-palette-primary",
                )}
              >
                <FileText className={cn(
                  "h-4 w-4 mr-1.5 transition-transform duration-300",
                  pathname === "/sitemap" || pathname.startsWith("/sitemap") ? "scale-110" : "group-hover:scale-110"
                )} />
                Sitemap
              </Link>
              <Link
                href="/api"
                className={cn(
                  "text-sm font-semibold transition-all duration-300 hover:text-palette-primary relative py-2 px-2 flex items-center whitespace-nowrap group",
                  pathname === "/api" || pathname.startsWith("/api")
                    ? "text-palette-primary font-bold after:absolute after:bottom-[-10px] after:left-0 after:right-0 after:h-1 after:bg-palette-primary after:rounded-full after:animate-pulse"
                    : "text-slate-600 hover:text-palette-primary",
                )}
              >
                <Code className={cn(
                  "h-4 w-4 mr-1.5 transition-transform duration-300",
                  pathname === "/api" || pathname.startsWith("/api") ? "scale-110" : "group-hover:scale-110"
                )} />
                API
              </Link>
              <Link
                href="/links"
                className={cn(
                  "text-sm font-semibold transition-all duration-300 hover:text-palette-primary relative py-2 px-2 flex items-center whitespace-nowrap group",
                  pathname === "/links" || pathname.startsWith("/links")
                    ? "text-palette-primary font-bold after:absolute after:bottom-[-10px] after:left-0 after:right-0 after:h-1 after:bg-palette-primary after:rounded-full after:animate-pulse"
                    : "text-slate-600 hover:text-palette-primary",
                )}
              >
                <Link2 className={cn(
                  "h-4 w-4 mr-1.5 transition-transform duration-300",
                  pathname === "/links" || pathname.startsWith("/links") ? "scale-110" : "group-hover:scale-110"
                )} />
                Links
              </Link>
              <Link
                href="/typography"
                className={cn(
                  "text-sm font-semibold transition-all duration-300 hover:text-palette-primary relative py-2 px-2 flex items-center whitespace-nowrap group",
                  pathname === "/typography" || pathname.startsWith("/typography")
                    ? "text-palette-primary font-bold after:absolute after:bottom-[-10px] after:left-0 after:right-0 after:h-1 after:bg-palette-primary after:rounded-full after:animate-pulse"
                    : "text-slate-600 hover:text-palette-primary",
                )}
              >
                <Type className={cn(
                  "h-4 w-4 mr-1.5 transition-transform duration-300",
                  pathname === "/typography" || pathname.startsWith("/typography") ? "scale-110" : "group-hover:scale-110"
                )} />
                Typography
              </Link>
            </div>
          </div>

          {/* Right side - Mobile Menu Button */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            <button
              className="lg:hidden p-2 rounded-md text-slate-600 hover:text-palette-primary hover:bg-palette-accent-3 transition-all duration-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
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
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                    pathname === "/performance" || pathname.startsWith("/performance")
                      ? "bg-palette-accent-3 text-palette-primary font-semibold shadow-sm"
                      : "text-slate-600 hover:bg-palette-accent-3 hover:text-palette-primary"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Gauge className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    pathname === "/performance" || pathname.startsWith("/performance") ? "scale-110" : ""
                  )} />
                  <span>Performance</span>
                </Link>
                <Link
                  href="/monitor"
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                    pathname === "/monitor" || pathname.startsWith("/monitor")
                      ? "bg-palette-accent-3 text-palette-primary font-semibold shadow-sm"
                      : "text-slate-600 hover:bg-palette-accent-3 hover:text-palette-primary"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Eye className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    pathname === "/monitor" || pathname.startsWith("/monitor") ? "scale-110" : ""
                  )} />
                  <span>Monitor</span>
                </Link>
                <Link
                  href="/ssl"
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                    pathname === "/ssl" || pathname.startsWith("/ssl")
                      ? "bg-palette-accent-3 text-palette-primary font-semibold shadow-sm"
                      : "text-slate-600 hover:bg-palette-accent-3 hover:text-palette-primary"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Lock className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    pathname === "/ssl" || pathname.startsWith("/ssl") ? "scale-110" : ""
                  )} />
                  <span>SSL Check</span>
                </Link>
                <Link
                  href="/dns"
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                    pathname === "/dns" || pathname.startsWith("/dns")
                      ? "bg-palette-accent-3 text-palette-primary font-semibold shadow-sm"
                      : "text-slate-600 hover:bg-palette-accent-3 hover:text-palette-primary"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Server className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    pathname === "/dns" || pathname.startsWith("/dns") ? "scale-110" : ""
                  )} />
                  <span>DNS Check</span>
                </Link>
                <Link
                  href="/sitemap"
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                    pathname === "/sitemap" || pathname.startsWith("/sitemap")
                      ? "bg-palette-accent-3 text-palette-primary font-semibold shadow-sm"
                      : "text-slate-600 hover:bg-palette-accent-3 hover:text-palette-primary"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <FileText className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    pathname === "/sitemap" || pathname.startsWith("/sitemap") ? "scale-110" : ""
                  )} />
                  <span>Sitemap</span>
                </Link>
                <Link
                  href="/api"
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                    pathname === "/api" || pathname.startsWith("/api")
                      ? "bg-palette-accent-3 text-palette-primary font-semibold shadow-sm"
                      : "text-slate-600 hover:bg-palette-accent-3 hover:text-palette-primary"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Code className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    pathname === "/api" || pathname.startsWith("/api") ? "scale-110" : ""
                  )} />
                  <span>API</span>
                </Link>
                <Link
                  href="/links"
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                    pathname === "/links" || pathname.startsWith("/links")
                      ? "bg-palette-accent-3 text-palette-primary font-semibold shadow-sm"
                      : "text-slate-600 hover:bg-palette-accent-3 hover:text-palette-primary"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link2 className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    pathname === "/links" || pathname.startsWith("/links") ? "scale-110" : ""
                  )} />
                  <span>Links</span>
                </Link>
                <Link
                  href="/typography"
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                    pathname === "/typography" || pathname.startsWith("/typography")
                      ? "bg-palette-accent-3 text-palette-primary font-semibold shadow-sm"
                      : "text-slate-600 hover:bg-palette-accent-3 hover:text-palette-primary"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Type className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    pathname === "/typography" || pathname.startsWith("/typography") ? "scale-110" : ""
                  )} />
                  <span>Typography</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
