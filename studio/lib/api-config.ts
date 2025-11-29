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
  
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // In browser context (production)
    if (envUrl) {
      // If env var is set, ensure it uses HTTPS in production (not localhost)
      // Convert HTTP to HTTPS if we're on HTTPS page
      if (window.location.protocol === 'https:' && envUrl.startsWith('http://') && !envUrl.includes('localhost')) {
        console.warn('Converting HTTP API URL to HTTPS to avoid mixed content errors');
        return envUrl.replace('http://', 'https://');
      }
      return envUrl;
    }
    // No env var: use same origin (relative URLs - automatic HTTPS)
    return '';
  }
  
  // Server-side rendering
  if (envUrl) {
    return envUrl;
  }
  
  // Default to localhost for development
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

