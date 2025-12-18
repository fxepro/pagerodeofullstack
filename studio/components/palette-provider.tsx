"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { usePalette } from '@/hooks/use-palette';
import { useSiteConfig } from '@/hooks/use-site-config';

/**
 * PaletteProvider - Applies palette and typography on every page load/navigation
 * This component ensures the active palette is fetched and applied whenever the route changes
 */
export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { palette, refetch: refetchPalette } = usePalette();
  const { refetch: refetchTypography } = useSiteConfig();

  // Re-fetch palette and typography on route change to ensure fresh data
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      refetchPalette();
      refetchTypography();
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, refetchPalette, refetchTypography]);

  // This component doesn't render anything, it just ensures hooks run
  return <>{children}</>;
}

