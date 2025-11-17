"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageCircle, BarChart3, LogIn, LogOut, User, FileText, Settings } from "lucide-react";
import { useEffect, useState } from "react";

import { getDjangoApiUrl } from "@/lib/api-config";

export function TopNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Update loggedIn state on route change and storage events
  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoggedIn(false);
        setUser(null);
        return;
      }
      
      // Validate token by fetching user info
      try {
        const res = await fetch(getDjangoApiUrl('/api/user-info/'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setLoggedIn(true);
        } else {
          // Token is invalid - clear it
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          setLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        // Network error or invalid token
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setLoggedIn(false);
        setUser(null);
      }
    };
    checkToken();
    window.addEventListener("storage", checkToken);
    return () => window.removeEventListener("storage", checkToken);
  }, []);

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoggedIn(false);
        setUser(null);
        return;
      }
      
      // Validate token by fetching user info
      try {
        const res = await fetch(getDjangoApiUrl('/api/user-info/'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setLoggedIn(true);
        } else {
          // Token is invalid - clear it
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          setLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        // Network error or invalid token
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setLoggedIn(false);
        setUser(null);
      }
    };
    checkToken();
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
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
              className="text-slate-700 hover:text-palette-primary hover:bg-palette-200/50 transition-all duration-300 px-2 py-1 text-xs"
              asChild
            >
              <Link href="/blog">
                <FileText className="h-3.5 w-3.5 mr-1" />
                Blog
              </Link>
            </Button>
            
            <Button 
              variant="ghost"
              size="sm"
              className="text-slate-700 hover:text-palette-primary hover:bg-palette-200/50 transition-all duration-300 px-2 py-1 text-xs"
              asChild
            >
              <Link href="/feedback">
                <MessageCircle className="h-3.5 w-3.5 mr-1" />
                Feedback
              </Link>
            </Button>
            
            <Button 
              variant="ghost"
              size="sm"
              className="text-slate-700 hover:text-palette-primary hover:bg-palette-200/50 transition-all duration-300 px-2 py-1 text-xs"
              asChild
            >
              <Link href="/consult">
                <User className="h-3.5 w-3.5 mr-1" />
                Consult
              </Link>
            </Button>
            
            <Button 
              variant="ghost"
              size="sm"
              className="text-slate-700 hover:text-palette-primary hover:bg-palette-200/50 transition-all duration-300 px-2 py-1 text-xs"
              asChild
            >
              <Link href="/upgrade">
                <BarChart3 className="h-3.5 w-3.5 mr-1" />
                Upgrade
              </Link>
            </Button>
            
            {loggedIn ? (
              <>
                {/* Dashboard - for all logged-in users */}
                <Button 
                  variant="ghost"
                  size="sm"
                  className="text-slate-700 hover:text-palette-primary hover:bg-palette-200/50 transition-all duration-300 px-2 py-1 text-xs"
                  asChild
                >
                  <Link href={user?.role === 'admin' ? "/admin/dashboard" : "/dashboard"}>
                    <User className="h-3.5 w-3.5 mr-1" />
                    Dashboard
                  </Link>
                </Button>
                
                {/* Logout button for all logged-in users */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-700 hover:text-palette-primary hover:bg-palette-200/50 transition-all duration-300 px-2 py-1 text-xs"
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
                className="text-slate-700 hover:text-palette-primary hover:bg-palette-200/50 transition-all duration-300 px-2 py-1 text-xs"
                asChild
              >
                <Link href="/login">
                  <LogIn className="h-3.5 w-3.5 mr-1" />
                  Login
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
