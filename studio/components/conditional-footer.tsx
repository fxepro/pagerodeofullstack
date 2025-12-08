"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/footer";

export function ConditionalFooter() {
  const pathname = usePathname();
  
  // Hide footer on dashboard, admin, and workspace routes (they have their own footers)
  const isDashboard = pathname?.startsWith("/dashboard");
  const isAdmin = pathname?.startsWith("/admin");
  const isWorkspace = pathname?.startsWith("/workspace");
  
  // Don't render the public footer on dashboard, admin, or workspace routes
  if (isDashboard || isAdmin || isWorkspace) {
    return null;
  }
  
  // Render public footer for all other routes
  return <Footer />;
}



