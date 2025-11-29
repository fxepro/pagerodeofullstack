import { useState, useEffect } from 'react';
import axios from 'axios';

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

  useEffect(() => {
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
  }, []);

  const fetchSiteConfig = async () => {
    try {
      // Fetch active typography preset (public endpoint, no auth)
      // Always use relative URL in browser to match page protocol (HTTPS automatically)
      // Server-side rendering: use env var or default
      const apiUrl = typeof window !== 'undefined' 
        ? '/api/typography/active/'  // Relative URL - automatically uses HTTPS if page is HTTPS
        : `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/typography/active/`;
      const typographyResponse = await axios.get(apiUrl);
      
      // Apply typography from the active preset
      if (typographyResponse.data) {
        applyTypographyToDOM(typographyResponse.data);
        
        // Cache typography for instant application on next load
        localStorage.setItem('activeTypography', JSON.stringify(typographyResponse.data));
      }
      
      setLoading(false);
    } catch (err: any) {
      console.warn('Could not fetch typography from backend:', err.message);
      console.warn('Using default typography. Make sure to run: python manage.py setup_default_typography');
      setError('Using default typography');
      setLoading(false);
      // Apply default typography on error
      applyDefaultTypography();
    }
  };

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

  return { config, loading, error, refetch: fetchSiteConfig };
}

