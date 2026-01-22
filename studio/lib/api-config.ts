/**
 * Centralized API configuration
 * 
 * SINGLE SOURCE OF TRUTH for API base URL
 * All API calls should use getApiBaseUrl() from this file
 * 
 * For production, the Django backend is served on the same domain as the Next.js frontend
 * via reverse proxy. Use relative URLs for Next.js API routes and absolute URLs for Django backend.
 */

// Cache key for storing API base URL in localStorage (for validation)
const API_BASE_URL_CACHE_KEY = 'pagerodeo_api_base_url';
const API_BASE_URL_VERSION_KEY = 'pagerodeo_api_base_url_version';
const CURRENT_VERSION = '1.0.0'; // Increment this to force refresh

/**
 * Get the Django backend API base URL
 * In production, this should be the same domain as the frontend (via reverse proxy)
 * In development, defaults to localhost:8000
 * 
 * This function enforces a single source of truth and validates cached values
 */
export function getApiBaseUrl(): string {
  // Always check env var first (highest priority)
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // Validate and sync with localStorage cache
    const cachedUrl = localStorage.getItem(API_BASE_URL_CACHE_KEY);
    const cachedVersion = localStorage.getItem(API_BASE_URL_VERSION_KEY);
    
    // If env var is set, use it and update cache
    if (envUrl) {
      // Validate env URL (should not be port 3000 or 3001 - those are frontend ports)
      if (envUrl.includes(':3000') || envUrl.includes(':3001')) {
        console.error('[API Config] ❌ Invalid API base URL in env var (contains frontend port):', envUrl);
        console.error('[API Config] Backend should be on port 8000, not 3000/3001');
        // Fall through to use default
      } else {
        // Valid env URL - update cache
        if (cachedUrl !== envUrl || cachedVersion !== CURRENT_VERSION) {
          localStorage.setItem(API_BASE_URL_CACHE_KEY, envUrl);
          localStorage.setItem(API_BASE_URL_VERSION_KEY, CURRENT_VERSION);
          console.log('[API Config] ✅ Using API base URL from env:', envUrl);
        }
        
        // Ensure HTTPS in production (not localhost)
        if (window.location.protocol === 'https:' && envUrl.startsWith('http://') && !envUrl.includes('localhost')) {
          console.warn('[API Config] Converting HTTP API URL to HTTPS to avoid mixed content errors');
          return envUrl.replace('http://', 'https://');
        }
        return envUrl;
      }
    }
    
    // No env var: check cache
    if (cachedUrl && cachedVersion === CURRENT_VERSION) {
      // Validate cached URL
      if (cachedUrl.includes(':3000') || cachedUrl.includes(':3001')) {
        console.error('[API Config] ❌ Invalid cached API URL (contains frontend port):', cachedUrl);
        localStorage.removeItem(API_BASE_URL_CACHE_KEY);
        localStorage.removeItem(API_BASE_URL_VERSION_KEY);
      } else {
        console.log('[API Config] Using cached API base URL:', cachedUrl);
        return cachedUrl;
      }
    }
    
    // No env var and no valid cache: use same origin (relative URLs - automatic HTTPS)
    // This works in production when frontend and backend are on same domain
    const defaultUrl = '';
    localStorage.setItem(API_BASE_URL_CACHE_KEY, defaultUrl);
    localStorage.setItem(API_BASE_URL_VERSION_KEY, CURRENT_VERSION);
    console.log('[API Config] Using relative URLs (same origin)');
    return defaultUrl;
  }
  
  // Server-side rendering
  if (envUrl) {
    // Validate env URL on server side too
    if (envUrl.includes(':3000') || envUrl.includes(':3001')) {
      console.error('[API Config] ❌ Invalid API base URL in env var (contains frontend port):', envUrl);
      // Fall through to default
    } else {
      return envUrl;
    }
  }
  
  // Default to localhost:8000 for development (backend port, not frontend)
  return 'http://localhost:8000';
}

/**
 * Clear cached API base URL (forces refresh on next call)
 */
export function clearApiBaseUrlCache(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(API_BASE_URL_CACHE_KEY);
    localStorage.removeItem(API_BASE_URL_VERSION_KEY);
    console.log('[API Config] ✅ Cleared API base URL cache');
  }
}

/**
 * Get the current API base URL (for debugging)
 */
export function getCurrentApiBaseUrl(): string {
  return getApiBaseUrl();
}

/**
 * Validate API base URL (ensures it's not a frontend port)
 */
export function validateApiBaseUrl(url: string): boolean {
  if (!url) return true; // Empty string (relative URL) is valid
  if (url.includes(':3000') || url.includes(':3001')) {
    console.error('[API Config] ❌ Invalid API base URL (contains frontend port):', url);
    return false;
  }
  return true;
}

/**
 * Get the full Django API endpoint URL
 */
export function getDjangoApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // Ensure endpoint starts with /api/
  if (!cleanEndpoint.startsWith('/api/')) {
    return `${baseUrl}/api${cleanEndpoint}`;
  }
  return `${baseUrl}${cleanEndpoint}`;
}

/**
 * Get Next.js API route URL (relative, for same-origin requests)
 */
export function getNextApiUrl(endpoint: string): string {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `/api/${cleanEndpoint}`;
}
