"use client";

import { usePathname } from "next/navigation";
import { TopNavigation } from "@/components/top-navigation";
import { MainNavigation } from "@/components/main-navigation";

export function ConditionalNavigation() {
  const pathname = usePathname();
  
  // Hide public navigation for dashboard routes
  const isDashboardRoute = pathname.startsWith('/dashboard');
  
  if (isDashboardRoute) {
    return null; // No public navigation for dashboard
  }
  
  return (
    <>
      <TopNavigation />
      <MainNavigation />
    </>
  );
}
