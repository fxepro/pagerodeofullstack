"use client";

import { usePathname } from "next/navigation";
import { TopNavigation } from "@/components/top-navigation";
import { MainNavigation } from "@/components/main-navigation";

export function ConditionalNavigation() {
  const pathname = usePathname();
  
  // Hide public navigation for dashboard and workspace routes
  // Exception: Show navigation for workspace/login page
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isWorkspaceRoute = pathname.startsWith('/workspace') && pathname !== '/workspace/login';
  
  if (isDashboardRoute || isWorkspaceRoute) {
    return null; // No public navigation for dashboard or workspace
  }
  
  return (
    <>
      <TopNavigation />
      <MainNavigation />
    </>
  );
}
