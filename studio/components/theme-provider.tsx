"use client";

import { useEffect } from "react";
import { initializeTheme } from "@/lib/theme";
import { usePalette } from "@/hooks/use-palette";
import { useSiteConfig } from "@/hooks/use-site-config";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Fetch and apply active palette from backend
  const { palette, loading: paletteLoading } = usePalette();
  
  // Fetch and apply site configuration (typography, etc.)
  const { config, loading: configLoading } = useSiteConfig();
  
  useEffect(() => {
    // Initialize dark/light theme mode
    initializeTheme();
  }, []);

  return <>{children}</>;
}