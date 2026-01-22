import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';

export interface Palette {
  id: number;
  name: string;
  description: string;
  primary_color: string;
  secondary_color: string;
  accent_1: string;
  accent_2: string;
  accent_3: string;
  is_active: boolean;
}

export function usePalette() {
  const [palette, setPalette] = useState<Palette | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const fetchingRef = useRef(false);

  useLayoutEffect(() => {
    // Immediately apply cached palette to prevent flash
    if (typeof window === 'undefined') return;
    const cachedPalette = localStorage.getItem('activePalette');
    if (cachedPalette) {
      try {
        const paletteData = JSON.parse(cachedPalette);
        applyPaletteToDOM(paletteData);
        setPalette(paletteData);
        setLoading(false);
      } catch (e) {
        console.warn('Failed to parse cached palette');
      }
    }
  }, []);

  // Also apply palette whenever it changes or route changes
  useEffect(() => {
    if (palette) {
      applyPaletteToDOM(palette);
    } else if (typeof window !== 'undefined') {
      // If no palette loaded yet, ensure cached palette is applied on route change
      const cachedPalette = localStorage.getItem('activePalette');
      if (cachedPalette) {
        try {
          const paletteData = JSON.parse(cachedPalette);
          applyPaletteToDOM(paletteData);
        } catch (e) {
          // Ignore parse errors, will fall back to default
        }
      } else {
        // Apply default if nothing cached
        applyDefaultPalette();
      }
    }
  }, [palette, pathname]); // Re-apply on palette change or route change

  const fetchActivePalette = useCallback(async () => {
    // Prevent duplicate simultaneous requests
    if (fetchingRef.current) return;
    
    fetchingRef.current = true;
    try {
      // Public endpoint - no auth required
      // ALWAYS use full Django backend URL to bypass Next.js rewrites (per critical implementation doc)
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const apiUrl = `${apiBase.replace(/\/$/, '')}/api/palettes/active/`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch palette: ${response.statusText}`);
      }
      
      const paletteData = await response.json();
      setPalette(paletteData);
      applyPaletteToDOM(paletteData);
      
      // Cache palette for instant application on next load
      localStorage.setItem('activePalette', JSON.stringify(paletteData));
      
      setLoading(false);
    } catch (err: any) {
      // Only log warning if not a network error (backend might not be running in dev)
      if (err.message !== 'Failed to fetch' && !err.message.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Could not fetch palette from backend:', err.message);
      }
      // Silent fallback - app will use cached or default palette
      setError('Using default palette');
      setPalette(prev => {
        if (prev) {
          // Keep previously applied palette (likely from cache)
          return prev;
        }
        // Apply default palette only if nothing else available
        applyDefaultPalette();
        return {
          id: 0,
          name: 'Default Purple',
          description: 'Default system palette',
          primary_color: '#9333ea',
          secondary_color: '#7c3aed',
          accent_1: '#a855f7',
          accent_2: '#c084fc',
          accent_3: '#e9d5ff',
          is_active: true,
        } satisfies Palette;
      });
      setLoading(false);
    } finally {
      fetchingRef.current = false;
    }
  }, []); // Empty deps - function doesn't depend on any props/state

  useEffect(() => {
    // Fetch fresh data from API on mount and route changes
    fetchActivePalette();
  }, [pathname, fetchActivePalette]); // Re-fetch when route changes

  const applyPaletteToDOM = (paletteData: Palette) => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    
    // Apply colors as CSS custom properties
    root.style.setProperty('--color-primary', paletteData.primary_color);
    root.style.setProperty('--color-secondary', paletteData.secondary_color);
    root.style.setProperty('--color-accent-1', paletteData.accent_1);
    root.style.setProperty('--color-accent-2', paletteData.accent_2);
    root.style.setProperty('--color-accent-3', paletteData.accent_3);
    
    // Generate lighter and darker variants for hover states
    root.style.setProperty('--color-primary-hover', adjustColorBrightness(paletteData.primary_color, -10));
    root.style.setProperty('--color-secondary-hover', adjustColorBrightness(paletteData.secondary_color, -10));
    
    // Store palette name as data attribute for debugging
    root.setAttribute('data-palette', paletteData.name);
  };

  const applyDefaultPalette = () => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    // Default purple palette
    root.style.setProperty('--color-primary', '#9333ea');
    root.style.setProperty('--color-secondary', '#7c3aed');
    root.style.setProperty('--color-accent-1', '#a855f7');
    root.style.setProperty('--color-accent-2', '#c084fc');
    root.style.setProperty('--color-accent-3', '#e9d5ff');
    root.style.setProperty('--color-primary-hover', '#7e22ce');
    root.style.setProperty('--color-secondary-hover', '#6d28d9');
  };

  return { palette, loading, error, refetch: fetchActivePalette };
}

// Helper function to adjust color brightness
function adjustColorBrightness(hex: string, percent: number): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Adjust brightness
  const newR = Math.max(0, Math.min(255, r + (r * percent / 100)));
  const newG = Math.max(0, Math.min(255, g + (g * percent / 100)));
  const newB = Math.max(0, Math.min(255, b + (b * percent / 100)));
  
  // Convert back to hex
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

