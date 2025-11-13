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
            <Link href="/" className="group">
              <Image 
                src="/screens/pagerodeo-Logo.png" 
                alt="PageRodeo Logo" 
                width={160} 
                height={40}
                className="object-contain group-hover:opacity-90 transition-opacity duration-300"
              />
            </Link>
          </div>

          {/* Center - Feature Navigation */}
          <div className="hidden lg:flex items-center justify-center flex-1 mx-12">
            <div className="flex items-center space-x-8">
              <Link
                href="/"
                className={cn(
                  "text-sm font-semibold transition-all duration-300 hover:text-palette-primary relative py-2 px-2 flex items-center whitespace-nowrap",
                  pathname === "/"
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
                  href="/"
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/"
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
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
