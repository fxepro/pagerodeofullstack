/**
 * Centralized API configuration
 * 
 * For production, the Django backend is served on the same domain as the Next.js frontend
 * via reverse proxy. Use relative URLs for Next.js API routes and absolute URLs for Django backend.
 */

/**
 * Get the Django backend API base URL
 * In production, this should be the same domain as the frontend (via reverse proxy)
 * In development, defaults to localhost:8000
 */
export function getApiBaseUrl(): string {
  // Always check env var first
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // In browser, use the same origin (production setup with reverse proxy)
    // The Django backend is served at the same origin via reverse proxy
    return window.location.origin;
  }
  
  // Server-side: default to localhost for development
  return 'http://localhost:8000';
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

