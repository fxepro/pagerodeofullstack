import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';

export interface SiteConfig {
  id: number;
  site_name: string;
  site_description: string;
  default_language: string;
  default_theme: string;
  active_palette: number | null;
  
  // Typography
  body_font: string;
  heading_font: string;
  font_size_base: string;
  font_size_h1: string;
  font_size_h2: string;
  font_size_h3: string;
  font_size_h4: string;
  font_size_h5: string;
  font_size_h6: string;
  line_height_base: string;
  
  // Other settings
  session_timeout_minutes: number;
  max_login_attempts: number;
  require_strong_passwords: boolean;
  enable_two_factor: boolean;
  enable_email_verification: boolean;
  enable_email_notifications: boolean;
  enable_push_notifications: boolean;
  enable_sms_notifications: boolean;
  notification_email: string;
  api_base_url: string;
  api_rate_limit: number;
  enable_cors: boolean;
  enable_api_docs: boolean;
}

export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  
  // Get pathname using Next.js router (this hook is only used in client components)
  const pathname = usePathname();

  const applyTypographyToDOM = (typographyData: any) => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    
    // Apply typography CSS custom properties from TypographyPreset
    root.style.setProperty('--font-body', typographyData.body_font);
    root.style.setProperty('--font-heading', typographyData.heading_font);
    root.style.setProperty('--font-size-base', typographyData.font_size_base);
    root.style.setProperty('--font-size-h1', typographyData.font_size_h1);
    root.style.setProperty('--font-size-h2', typographyData.font_size_h2);
    root.style.setProperty('--font-size-h3', typographyData.font_size_h3);
    root.style.setProperty('--font-size-h4', typographyData.font_size_h4);
    root.style.setProperty('--font-size-h5', typographyData.font_size_h5);
    root.style.setProperty('--font-size-h6', typographyData.font_size_h6);
    root.style.setProperty('--line-height-base', typographyData.line_height_base);
  };

  const applyDefaultTypography = () => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    // Default typography
    root.style.setProperty('--font-body', 'Inter, system-ui, -apple-system, sans-serif');
    root.style.setProperty('--font-heading', 'Inter, system-ui, -apple-system, sans-serif');
    root.style.setProperty('--font-size-base', '16px');
    root.style.setProperty('--font-size-h1', '48px');
    root.style.setProperty('--font-size-h2', '36px');
    root.style.setProperty('--font-size-h3', '30px');
    root.style.setProperty('--font-size-h4', '24px');
    root.style.setProperty('--font-size-h5', '20px');
    root.style.setProperty('--font-size-h6', '18px');
    root.style.setProperty('--line-height-base', '1.6');
  };

  const fetchSiteConfig = useCallback(async () => {
    // Prevent duplicate simultaneous requests
    if (fetchingRef.current) return;
    
    fetchingRef.current = true;
    try {
      // Fetch active typography preset (public endpoint, no auth)
      let apiUrl: string;
      
      // ALWAYS use full Django backend URL to bypass Next.js rewrites (per critical implementation doc)
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      apiUrl = `${apiBase.replace(/\/$/, '')}/api/typography/active/`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch typography: ${response.statusText}`);
      }
      
      const typographyData = await response.json();
      
      // Apply typography from the active preset
      if (typographyData) {
        applyTypographyToDOM(typographyData);
        
        // Cache typography for instant application on next load
        localStorage.setItem('activeTypography', JSON.stringify(typographyData));
      }
      
      setLoading(false);
    } catch (err: any) {
      // Only log warning if not a network error (backend might not be running in dev)
      if (err.message !== 'Failed to fetch' && !err.message.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Could not fetch typography from backend:', err.message);
      }
      // Silent fallback - app will use cached or default typography
      setError('Using default typography');
      setLoading(false);
      // Apply default typography on error
      applyDefaultTypography();
    } finally {
      fetchingRef.current = false;
    }
  }, []); // Empty deps - function doesn't depend on any props/state

  useEffect(() => {
    // Ensure we're in browser context
    if (typeof window === 'undefined') return;
    
    // Skip typography fetch on /typography page - it's a frontend-only analysis tool
    // This prevents unnecessary API calls and mixed content warnings
    // Check both pathname (from Next.js) and window.location (fallback for SSR/hydration)
    const currentPath = pathname || window.location.pathname;
    if (currentPath === '/typography') {
      setLoading(false);
      // Still apply cached typography if available
      const cachedTypography = localStorage.getItem('activeTypography');
      if (cachedTypography) {
        try {
          const typographyData = JSON.parse(cachedTypography);
          applyTypographyToDOM(typographyData);
        } catch (e) {
          console.warn('Failed to parse cached typography');
        }
      } else {
        // Apply default typography for typography page
        applyDefaultTypography();
      }
      return;
    }

    // Immediately apply cached typography to prevent flash
    const cachedTypography = localStorage.getItem('activeTypography');
    if (cachedTypography) {
      try {
        const typographyData = JSON.parse(cachedTypography);
        applyTypographyToDOM(typographyData);
      } catch (e) {
        console.warn('Failed to parse cached typography');
      }
    }
    
    // Then fetch fresh data from API
    fetchSiteConfig();
  }, [pathname, fetchSiteConfig]); // Re-run when pathname changes

  return { config, loading, error, refetch: fetchSiteConfig };
}

