/**
 * Authentication utility functions
 * Handles session timeouts and authentication errors
 */

/**
 * Handle 401 Unauthorized errors - redirect to login with message
 */
export function handleAuthError(errorMessage?: string): void {
  if (typeof window === 'undefined') return;
  
  // Clear tokens
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  
  // Default message
  const message = errorMessage || 'Your session has expired or you have been logged out. Please log in again.';
  
  // Only redirect if not already on login/register/verify-email pages
  const currentPath = window.location.pathname;
  if (!currentPath.includes('/login') && 
      !currentPath.includes('/register') && 
      !currentPath.includes('/verify-email')) {
    // Redirect to login with error message
    window.location.href = `/login?error=${encodeURIComponent(message)}`;
  }
}

/**
 * Check if response is a 401 error
 */
export function isAuthError(error: any): boolean {
  return error?.response?.status === 401 || error?.status === 401;
}

