"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/footer";

export function ConditionalFooter() {
  const pathname = usePathname();
  
  // Hide footer on dashboard and admin routes (they have their own footers)
  const isDashboard = pathname?.startsWith("/dashboard");
  const isAdmin = pathname?.startsWith("/admin");
  
  // Don't render the public footer on dashboard or admin routes
  if (isDashboard || isAdmin) {
    return null;
  }
  
  // Render public footer for all other routes
  return <Footer />;
}



